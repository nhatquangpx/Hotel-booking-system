export const VIEW_MODES = {
  LIST: 'list',
  ROLE: 'role',
  HOTEL: 'hotel',
};

export const ROLE_ORDER = ['admin', 'owner', 'staff', 'guest'];

export const ROLE_LABELS = {
  admin: 'Quản trị viên',
  owner: 'Chủ khách sạn',
  staff: 'Nhân viên khách sạn',
  guest: 'Khách',
};

export const VIEW_MODE_OPTIONS = [
  { value: VIEW_MODES.LIST, label: 'Danh sách' },
  { value: VIEW_MODES.ROLE, label: 'Theo vai trò' },
  { value: VIEW_MODES.HOTEL, label: 'Theo khách sạn' },
];

/** Vai trò hiển thị riêng (theo nhóm role) khi ở chế độ theo khách sạn */
export const HOTEL_VIEW_SEPARATE_ROLES = ['guest', 'admin'];

export function getRoleLabel(role) {
  return ROLE_LABELS[role] || role;
}

export function filterUsers(users, { searchTerm, searchEmail, searchPhone, selectedRole }) {
  return users.filter((user) => {
    const matchesName = user.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEmail = user.email?.toLowerCase().includes(searchEmail.toLowerCase());
    const matchesPhone = user.phone?.includes(searchPhone);
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesName && matchesEmail && matchesPhone && matchesRole;
  });
}

export function groupUsersByRole(users, roles = ROLE_ORDER) {
  const groups = {};
  for (const role of roles) {
    groups[role] = [];
  }
  for (const user of users) {
    if (groups[user.role]) {
      groups[user.role].push(user);
    }
  }
  return groups;
}

function getOwnerId(hotel) {
  const owner = hotel.ownerId;
  if (!owner) return null;
  return String(owner._id || owner);
}

function getStaffForHotel(hotel, usersById) {
  const seen = new Set();
  const staff = [];

  for (const user of usersById.values()) {
    if (user.role !== 'staff') continue;
    const hotelId = user.assignedHotelId?._id || user.assignedHotelId;
    if (hotelId && String(hotelId) === String(hotel._id) && !seen.has(String(user._id))) {
      seen.add(String(user._id));
      staff.push(user);
    }
  }

  for (const rawId of hotel.staffIds || []) {
    const id = String(rawId._id || rawId);
    if (seen.has(id)) continue;
    const user = usersById.get(id);
    if (user?.role === 'staff') {
      seen.add(id);
      staff.push(user);
    }
  }

  return staff;
}

/**
 * Nhóm owner + staff theo khách sạn; guest/admin tách riêng theo role.
 */
export function buildHotelViewData(hotels, filteredUsers, allUsers) {
  const filteredIds = new Set(filteredUsers.map((u) => String(u._id)));
  const usersById = new Map(allUsers.map((u) => [String(u._id), u]));

  const hotelGroups = hotels
    .map((hotel) => {
      const ownerId = getOwnerId(hotel);
      const owner = ownerId ? usersById.get(ownerId) : null;
      const staff = getStaffForHotel(hotel, usersById);

      const visibleOwner = owner && filteredIds.has(String(owner._id)) ? owner : null;
      const visibleStaff = staff.filter((s) => filteredIds.has(String(s._id)));

      return {
        hotel,
        owner: visibleOwner,
        staff: visibleStaff,
        hasVisibleMembers: Boolean(visibleOwner) || visibleStaff.length > 0,
      };
    })
    .filter((g) => g.hasVisibleMembers);

  const assignedStaffIds = new Set();
  const assignedOwnerIds = new Set();

  for (const group of hotelGroups) {
    if (group.owner) assignedOwnerIds.add(String(group.owner._id));
    for (const s of group.staff) {
      assignedStaffIds.add(String(s._id));
    }
  }

  const orphanStaff = filteredUsers.filter(
    (u) => u.role === 'staff' && !assignedStaffIds.has(String(u._id))
  );

  const orphanOwners = filteredUsers.filter(
    (u) => u.role === 'owner' && !assignedOwnerIds.has(String(u._id))
  );

  const separateRoleUsers = filteredUsers.filter((u) =>
    HOTEL_VIEW_SEPARATE_ROLES.includes(u.role)
  );
  const separateRoleGroups = groupUsersByRole(
    separateRoleUsers,
    HOTEL_VIEW_SEPARATE_ROLES
  );

  return {
    hotelGroups,
    orphanStaff,
    orphanOwners,
    separateRoleGroups,
  };
}
