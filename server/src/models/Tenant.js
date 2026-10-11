import mongoose from 'mongoose';

const { Schema } = mongoose;

export const NICHES = ['powerplate', 'fitness', 'pilates', 'yoga', 'playroom', 'generic'];
export const TEMPLATES = ['fitness', 'pilates', 'powerplate', 'playroom', 'generic'];
export const CAPACITY_MODELS = ['PER_SLOT', 'CONCURRENT'];
export const BILLING_STATUSES = ['TRIAL', 'PAID', 'UNPAID', 'PAST_DUE', 'EXPIRED'];
export const BILLING_PLANS = ['pilot', 'standard'];

const themeSchema = new Schema(
  {
    primaryColor: { type: String, trim: true },
    secondaryColor: { type: String, trim: true },
    fontFamily: { type: String, trim: true },
    borderRadius: { type: String, trim: true },
    buttonStyle: { type: String, trim: true },
  },
  { _id: false },
);

const galleryImageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, trim: true },
    alt: { type: String, trim: true },
  },
  { _id: false },
);

const siteSettingsSchema = new Schema(
  {
    template: {
      type: String,
      enum: TEMPLATES,
      default: 'generic',
    },
    layout: {
      type: String,
      enum: ['banner', 'bar', 'sidebar'],
      default: 'banner',
    },
    paletteId: {
      type: String,
      trim: true,
      default: '',
    },
    visibleSections: {
      hero: { type: Boolean, default: true },
      about: { type: Boolean, default: true },
      services: { type: Boolean, default: true },
      schedule: { type: Boolean, default: true },
      gallery: { type: Boolean, default: true },
      contact: { type: Boolean, default: true },
      location: { type: Boolean, default: true },
      openingHours: { type: Boolean, default: true },
    },
    gallery: {
      type: [galleryImageSchema],
      default: [],
    },
    socialLinks: {
      instagram: { type: String, trim: true },
      facebook: { type: String, trim: true },
      tiktok: { type: String, trim: true },
      website: { type: String, trim: true },
    },
    seo: {
      title: { type: String, trim: true },
      description: { type: String, trim: true },
    },
  },
  { _id: false },
);

const workingHourSchema = new Schema(
  {
    day: { type: Number, required: true, min: 0, max: 6 },
    closed: { type: Boolean, default: false },
    open: { type: String, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    close: { type: String, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  },
  { _id: false },
);

const blockedPeriodSchema = new Schema(
  {
    startDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    endDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    reason: { type: String, trim: true },
  },
  { _id: false },
);

const bookingSettingsSchema = new Schema(
  {
    capacityModel: {
      type: String,
      enum: CAPACITY_MODELS,
      default: 'PER_SLOT',
    },
    workingHours: {
      type: [workingHourSchema],
      default: [],
    },
    blockedPeriods: {
      type: [blockedPeriodSchema],
      default: [],
    },
  },
  { _id: false },
);

const tenantSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },
    niche: {
      type: String,
      enum: NICHES,
      required: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    logoUrl: { type: String, trim: true },
    heroImageUrl: { type: String, trim: true },
    description: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    timezone: {
      type: String,
      required: true,
      default: 'Europe/Zagreb',
    },
    theme: {
      type: themeSchema,
      default: () => ({}),
    },
    siteSettings: {
      type: siteSettingsSchema,
      default: () => ({}),
    },
    bookingSettings: {
      type: bookingSettingsSchema,
      default: () => ({}),
    },
    active: {
      type: Boolean,
      default: true,
    },
    billing: {
      status: {
        type: String,
        enum: BILLING_STATUSES,
        default: 'TRIAL',
      },
      plan: {
        type: String,
        enum: BILLING_PLANS,
        default: 'pilot',
      },
      validUntil: {
        type: String,
        match: /^\d{4}-\d{2}-\d{2}$/,
      },
      lastPaidAt: { type: Date },
      amount: { type: Number, min: 0, default: 0 },
      currency: { type: String, default: 'EUR', trim: true },
      lastWarningSentAt: { type: Date },
      lastInvoiceSentAt: { type: Date },
      note: { type: String, trim: true, maxlength: 500 },
    },
  },
  {
    collection: 'tenants',
    timestamps: true,
  },
);

export default mongoose.model('Tenant', tenantSchema);
