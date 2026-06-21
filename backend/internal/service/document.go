package service

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/ticketon/tap/internal/domain"
	"github.com/ticketon/tap/internal/repository"
)

type DocumentService struct {
	docRepo     *repository.DocumentRepo
	partnerRepo *repository.PartnerRepo
}

func NewDocumentService(dr *repository.DocumentRepo, pr *repository.PartnerRepo) *DocumentService {
	return &DocumentService{docRepo: dr, partnerRepo: pr}
}

// docTypesByLegalStatus defines required docs per legal status
var docTypesByLegalStatus = map[domain.LegalStatus][]string{
	domain.LegalEntityLE:   {"partnership_agreement", "bank_details"},
	domain.LegalEntityIP:   {"partnership_agreement_ip", "registration_certificate"},
	domain.LegalEntityPhys: {"accession_agreement", "personal_data_consent", "identity_document"},
}

func (s *DocumentService) InitiateDocuments(ctx context.Context, partnerID uuid.UUID, legalStatus domain.LegalStatus) ([]*domain.LegalDocument, error) {
	partner, err := s.partnerRepo.GetByID(ctx, partnerID)
	if err != nil {
		return nil, err
	}

	// Update partner legal status
	partner.LegalStatus = &legalStatus
	if err := s.partnerRepo.Update(ctx, partner); err != nil {
		return nil, err
	}

	docTypes, ok := docTypesByLegalStatus[legalStatus]
	if !ok {
		return nil, fmt.Errorf("unknown legal status: %s", legalStatus)
	}

	var docs []*domain.LegalDocument
	for _, docType := range docTypes {
		doc := &domain.LegalDocument{
			ID:          uuid.New(),
			PartnerID:   partnerID,
			LegalStatus: legalStatus,
			DocType:     docType,
			Version:     1,
			Status:      domain.DocAwaitingPartnerSignature,
		}
		if err := s.docRepo.Create(ctx, doc); err != nil {
			return nil, err
		}
		docs = append(docs, doc)
	}

	return docs, nil
}

func (s *DocumentService) GetByPartner(ctx context.Context, partnerID uuid.UUID) ([]*domain.LegalDocument, error) {
	return s.docRepo.GetByPartner(ctx, partnerID)
}

func (s *DocumentService) GetByID(ctx context.Context, id uuid.UUID) (*domain.LegalDocument, error) {
	return s.docRepo.GetByID(ctx, id)
}

// UploadPartnerSigned — partner uploads signed copy
func (s *DocumentService) UploadPartnerSigned(ctx context.Context, partnerID, docID uuid.UUID, fileURL string) error {
	doc, err := s.docRepo.GetByID(ctx, docID)
	if err != nil {
		return err
	}
	if doc.PartnerID != partnerID {
		return domain.ErrForbidden
	}
	if doc.Status != domain.DocAwaitingPartnerSignature {
		return fmt.Errorf("document not awaiting partner signature, current status: %s", doc.Status)
	}

	return s.docRepo.UpdateStatus(ctx, docID,
		domain.DocUnderTicketonReview,
		repository.WithPartnerFile(fileURL),
	)
}

// AdminSign — Ticketon ops uploads counter-signed version
func (s *DocumentService) AdminSign(ctx context.Context, docID uuid.UUID, ticketonFileURL, finalFileURL string) error {
	doc, err := s.docRepo.GetByID(ctx, docID)
	if err != nil {
		return err
	}

	validStatuses := map[domain.DocumentStatus]bool{
		domain.DocUnderTicketonReview:      true,
		domain.DocAwaitingTicketonSignature: true,
	}
	if !validStatuses[doc.Status] {
		return fmt.Errorf("document not ready for signing, status: %s", doc.Status)
	}

	return s.docRepo.UpdateStatus(ctx, docID,
		domain.DocSigned,
		repository.WithTicketonFile(ticketonFileURL),
		repository.WithFinalFile(finalFileURL),
	)
}

// AdminReject — Ticketon ops rejects a document with reason
func (s *DocumentService) AdminReject(ctx context.Context, docID uuid.UUID, reason string) error {
	doc, err := s.docRepo.GetByID(ctx, docID)
	if err != nil {
		return err
	}
	_ = doc
	return s.docRepo.UpdateStatus(ctx, docID,
		domain.DocRejected,
		repository.WithRejection(reason),
	)
}

func (s *DocumentService) ListAll(ctx context.Context, filter repository.DocumentFilter) ([]*domain.LegalDocument, int64, error) {
	return s.docRepo.ListAll(ctx, filter)
}

// GetAdminDownloadURL returns the partner-signed file URL for a document (admin, no ownership check)
func (s *DocumentService) GetAdminDownloadURL(ctx context.Context, docID uuid.UUID) (string, error) {
	doc, err := s.docRepo.GetByID(ctx, docID)
	if err != nil {
		return "", err
	}
	if doc.PartnerFileURL != nil {
		return *doc.PartnerFileURL, nil
	}
	if doc.FinalSignedURL != nil {
		return *doc.FinalSignedURL, nil
	}
	return "", domain.ErrNotFound
}

// GenerateDocumentURL returns the presigned download URL for a document file
func (s *DocumentService) GetDownloadURL(ctx context.Context, partnerID, docID uuid.UUID, fileType string) (string, error) {
	doc, err := s.docRepo.GetByID(ctx, docID)
	if err != nil {
		return "", err
	}
	if doc.PartnerID != partnerID {
		return "", domain.ErrForbidden
	}

	switch fileType {
	case "partner":
		if doc.PartnerFileURL == nil {
			return "", domain.ErrNotFound
		}
		return *doc.PartnerFileURL, nil
	case "final":
		if doc.FinalSignedURL == nil {
			return "", domain.ErrNotFound
		}
		return *doc.FinalSignedURL, nil
	default:
		return "", domain.ErrNotFound
	}
}
