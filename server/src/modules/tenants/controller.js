import {
  createTenant,
  discoverTenants,
  getPublicTenant,
  listMyTenants,
  removeGalleryImage,
  updateSite,
  updateTenant,
  uploadImage,
} from './service.js';

export async function create(req, res) {
  const tenant = await createTenant(req.user, req.input.body);
  res.status(201).json({ tenant });
}

export async function mine(req, res) {
  const tenants = await listMyTenants(req.user);
  res.json({ tenants });
}

export async function discover(req, res) {
  const result = await discoverTenants(req.input.query);
  res.json(result);
}

export async function publicProfile(req, res) {
  const tenant = await getPublicTenant(req.input.params.slug);
  res.json({ tenant });
}

export async function update(req, res) {
  const tenant = await updateTenant(req.user, req.input.params.tenantId, req.input.body);
  res.json({ tenant });
}

export async function updateWebsite(req, res) {
  const tenant = await updateSite(req.user, req.input.params.tenantId, req.input.body);
  res.json({ tenant });
}

export async function upload(req, res) {
  const tenant = await uploadImage(
    req.user,
    req.input.params.tenantId,
    req.file,
    req.input.body.purpose,
  );
  res.json({ tenant });
}

export async function removeGallery(req, res) {
  const tenant = await removeGalleryImage(
    req.user,
    req.input.params.tenantId,
    req.input.body.publicId,
  );
  res.json({ tenant });
}
