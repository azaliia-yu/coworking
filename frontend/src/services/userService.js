import api from './api'

export const userService = {
getUsers: (params) => api.get('/auth/users/', { params }),
blockUser: (id) => api.post(`/auth/users/${id}/block/`),
unblockUser: (id) => api.post(`/auth/users/${id}/unblock/`),
}

export default userService
