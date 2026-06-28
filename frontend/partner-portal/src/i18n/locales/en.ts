export default {
  common: {
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    next: 'Next',
    back: 'Back',
    submit: 'Submit',
    required: 'Required field',
    error: 'Error',
    success: 'Success',
    copy: 'Copy',
    copied: 'Copied!'
  },
  nav: {
    dashboard: 'Dashboard',
    events: 'Events',
    links: 'Links',
    promoCodes: 'Promo Codes',
    payouts: 'Payouts',
    documents: 'Documents',
    requests: 'Requests',
    faq: 'FAQ',
    notifications: 'Notifications',
    profile: 'Profile',
    logout: 'Log out'
  },
  auth: {
    login: 'Log in',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    fullName: 'Full name',
    phone: 'Phone',
    segment: 'Partner type',
    segments: {
      influencer: 'Blogger / Influencer',
      ugc: 'UGC / Content platform',
      webservice: 'Web service / Website'
    },
    loginTitle: 'Partner login',
    registerTitle: 'Partner registration',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?'
  },
  onboarding: {
    step1: 'Partner type',
    step2: 'Contacts',
    step3: 'Bank details',
    step4: 'Offer',
    title: 'Welcome to TAP',
    subtitle: 'Complete registration in 4 easy steps',
    freedomPayHint: 'Payouts are made to your bank account in KZT',
    offerTitle: 'Partner Offer Agreement',
    offerText: 'I agree to the terms of the Ticketon Affiliate Platform partnership agreement, including #sponsored content requirements, no-fraud and no-self-referral rules.',
    accept: 'Accept offer',
    checklistTitle: 'Getting started',
    checklistDone: 'done',
    steps: {
      account: 'Account created',
      kyc: 'Bank details filled in',
      kycLink: 'Fill in',
      offer: 'Offer accepted',
      offerLink: 'Accept',
      documents: 'Document flow initiated',
      documentsLink: 'Start',
    }
  },
  kyc: {
    title: 'Bank Details',
    subtitle: 'Provide your bank details to receive payouts',
    iin: 'IIN / BIN (optional)',
    accountHolder: 'Account holder',
    accountHolderPlaceholder: 'Full name or company name',
    bankName: 'Bank name',
    bankNamePlaceholder: 'e.g. Halyk Bank, Kaspi, Freedom Pay...',
    bankAccount: 'Account number / IBAN',
    bankBic: 'BIC / Swift code',
    bankBicPlaceholder: 'HSBKKZKX',
    freedomPayOptional: 'If you use Freedom Pay — provide your account number',
    accountOptional: '(optional)',
    freedomPayPlaceholder: 'Freedom Pay account number or email',
    save: 'Save bank details',
    verified: 'Details verified',
    verifiedDesc: 'Payment details have been successfully verified'
  },
  dashboard: {
    title: 'Dashboard',
    welcome: 'Hello,',
    clicks: 'Clicks',
    orders: 'Orders',
    earned: 'Earned',
    conversion: 'Conversion',
    balance: 'Available balance',
    pending: 'Pending',
    chartTitle: 'Clicks & orders (30 days)',
    period: {
      day: 'Today',
      week: 'Week',
      month: 'Month'
    }
  },
  events: {
    title: 'Event Catalog',
    search: 'Search events',
    city: 'City',
    category: 'Category',
    allCities: 'All cities',
    allCategories: 'All categories',
    getLink: 'Get link',
    noEvents: 'No events found',
    goldTitle: 'Full Ticketon.kz Catalog',
    goldDesc: 'As a Gold partner you have access to all ticketon.kz events via the open API',
    goldApiAccess: 'You have activated access to the Ticketon open API — all platform events are available for promotion',
    resetFilters: 'Reset filters',
    totalEvents: 'events'
  },
  links: {
    title: 'Link Generator',
    generate: 'Generate link',
    generated: 'Your link is ready',
    trackingUrl: 'Tracking link',
    channel: 'Placement channel',
    channels: {
      instagram: 'Instagram',
      tiktok: 'TikTok',
      youtube: 'YouTube',
      telegram: 'Telegram',
      web: 'Website'
    }
  },
  promoCodes: {
    title: 'Promo Codes',
    description: 'A promo code is an alternative attribution method for Stories and posts where tracking links may be lost when copied',
    create: 'Create promo code',
    code: 'Code',
    codePlaceholder: 'e.g. VASYA2026',
    eventOptional: 'Event (optional)',
    noEvent: 'All events',
    uses: 'uses',
    active: 'Active',
    inactive: 'Inactive',
    deactivate: 'Deactivate',
    noCodes: 'No promo codes yet'
  },
  payouts: {
    title: 'Payouts',
    request: 'Request payout',
    requestTitle: 'New payout request',
    submit: 'Submit request',
    amount: 'Payout amount',
    minThreshold: 'Minimum amount: 5,000 ₸',
    minError: 'Minimum payout amount is 5,000 ₸',
    insufficientBalance: 'Insufficient balance',
    availableToWithdraw: 'Available to withdraw',
    paid: 'Paid out',
    willSendTo: 'Funds will be sent to:',
    destination: 'Payout destination',
    noBankDetails: 'Add your bank details in your profile to request a payout',
    status: {
      requested: 'Requested',
      processing: 'Processing',
      paid: 'Paid',
      failed: 'Failed'
    },
    history: 'Payout history',
    emptyTitle: 'No payouts yet',
    emptyDesc: 'Request a payout once you reach the minimum amount'
  },
  documents: {
    title: 'Documents',
    legalStatus: 'Legal status',
    legalStatuses: {
      legal_entity: 'Legal entity',
      sole_proprietor: 'Sole proprietor',
      individual: 'Individual'
    },
    docTypes: {
      partnership_agreement: 'Partnership Agreement',
      partnership_agreement_ip: 'Partnership Agreement (SP)',
      accession_agreement: 'Accession Agreement',
      personal_data_consent: 'Personal Data Consent',
      identity_document: 'Identity Document',
      bank_details: 'Bank Details',
      registration_certificate: 'SP Registration Certificate'
    },
    status: {
      draft: 'Draft',
      awaiting_partner_signature: 'Awaiting your signature',
      under_ticketon_review: 'Under Ticketon review',
      awaiting_ticketon_signature: 'Awaiting Ticketon signature',
      signed: 'Signed by both parties',
      archived: 'Archived',
      rejected: 'Rejected'
    },
    upload: 'Upload signed document',
    download: 'Download',
    downloadFinal: 'Download final document',
    initiateTitle: 'Start document flow',
    chooseStatus: 'Choose your legal status to generate the document package',
    confirmStatus: 'Confirm status:',
    confirmDesc: 'A document package will be created for your status. You will receive documents for download, signing, and re-upload.',
    createPackage: 'Create document package',
    rejectionReason: 'Rejection reason:',
    uploadHint: 'Upload a link to the signed document (Google Drive, Dropbox, or other cloud storage)',
    uploadBtn: 'Upload'
  },
  notifications: {
    title: 'Notifications',
    markAllRead: 'Mark all as read',
    empty: 'No notifications yet'
  },
  requests: {
    title: 'My Requests',
    subtitle: 'Submit support requests and track their status',
    new: 'New request',
    newTitle: 'Create request',
    type: 'Request type',
    subject: 'Subject',
    subjectPlaceholder: 'Briefly describe your problem or question',
    body: 'Description',
    bodyPlaceholder: 'Describe the situation in detail...',
    formRequired: 'Please fill in the subject and description',
    empty: 'No requests yet',
    emptyDesc: 'Create a request if you have any questions or issues',
    adminNotes: 'Comments from the team',
    types: {
      general: 'General',
      api_access: 'API Access',
      payment_issue: 'Payment Issue',
      document: 'Documents',
      technical: 'Technical',
      other: 'Other'
    },
    status: {
      new: 'New',
      in_progress: 'In Progress',
      resolved: 'Resolved',
      closed: 'Closed'
    }
  },
  faq: {
    title: 'FAQ',
    subtitle: 'Answers to common questions about working with TAP',
    contacts: 'Contact us',
    noContacts: 'No contacts listed',
    categories: {
      general: 'General',
      payments: 'Payments',
      commissions: 'Commissions',
      tracking: 'Tracking',
      documents: 'Documents'
    }
  }
}
