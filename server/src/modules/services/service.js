import Service from '../../models/Service.js';
import Tenant from '../../models/Tenant.js';
import { HttpError } from '../../utils/httpError.js';
import { MANAGE_ROLES, requireMember } from '../access.js';

export function toService(service) {
  return {
    id: service._id,
    tenantId: service.tenantId,
    name: service.name,
    description: service.description || '',
    durationMinutes: service.durationMinutes,
    slotIntervalMinutes: service.slotIntervalMinutes,
    capacity: service.capacity,
    cancellationWindowMinutes: service.cancellationWindowMinutes,
    price: service.price,
    membershipRequired: service.membershipRequired,
    active: service.active,
  };
}

async function assertTenant(tenantId) {
  const tenant = await Tenant.findById(tenantId).select('_id active');
  if (!tenant) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });
  return tenant;
}

export async function listServices(user, tenantId) {
  await requireMember(user, tenantId, MANAGE_ROLES);
  const services = await Service.find({ tenantId }).sort({ name: 1 });
  return services.map(toService);
}

export async function createService(user, tenantId, input) {
  await requireMember(user, tenantId, MANAGE_ROLES);
  await assertTenant(tenantId);
  const service = await Service.create({ ...input, tenantId });
  return toService(service);
}

async function ownedService(user, serviceId) {
  const service = await Service.findById(serviceId);
  if (!service) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });
  try {
    await requireMember(user, service.tenantId, MANAGE_ROLES);
  } catch (error) {
    if (error?.code === 'FORBIDDEN') {
      throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });
    }
    throw error;
  }
  return service;
}

export async function updateService(user, serviceId, input) {
  const service = await ownedService(user, serviceId);
  Object.assign(service, input);
  await service.save();
  return toService(service);
}

export async function deactivateService(user, serviceId) {
  const service = await ownedService(user, serviceId);
  service.active = false;
  await service.save();
  return toService(service);
}
