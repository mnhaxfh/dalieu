import { Platform } from 'react-native';
import { API_BASE_URL } from '../config/constants';

interface RequestOptions {
  method: string;
  headers: Record<string, string>;
  body?: any;
}

async function request(path: string, options: RequestOptions) {
  const url = `${API_BASE_URL}${path}`;
  try {
    const response = await fetch(url, options);
    
    let responseData;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      let errorMsg = `Request failed with status ${response.status}`;

      // Log chi tiết lỗi ra console để debug
      console.error(`Full error response from ${path}:`, responseData);

      if (typeof responseData === 'object' && responseData) {
        const detail = (responseData as any).detail;
        if (Array.isArray(detail)) {
          errorMsg = detail
            .map((item: any) => item.msg || JSON.stringify(item))
            .join(', ');
        } else if (detail) {
          errorMsg = String(detail);
        } else {
          errorMsg = JSON.stringify(responseData);
        }
      } else if (responseData) {
        // Nếu Server trả về HTML (trang lỗi 500 mặc định), chỉ lấy một đoạn ngắn
        errorMsg = String(responseData).substring(0, 200);
      }
      throw new Error(errorMsg);
    }
    return responseData;
  } catch (error: any) {
    console.error(`API Error on ${options.method} ${path}:`, error);
    throw error;
  }
}

export const api = {
  auth: {
    async register(payload: any) {
      return request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: payload.username,
          full_name: payload.full_name,
          role: payload.role || 'worker',
          password: payload.password,
        }),
      });
    },

    async login(payload: any) {
      const details: Record<string, string> = {
        username: payload.username,
        password: payload.password,
      };
      
      const formBody = Object.keys(details)
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(details[key]))
        .join('&');

      return request('/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded' 
        },
        body: formBody,
      });
    },

    async logout(token: string) {
      return request('/auth/logout', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
    }
  },

  examinations: {
    async list(page: number, pageSize: number, token: string) {
      return request(`/examinations?page=${page}&page_size=${pageSize}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    },

    async get(id: number | string, token: string) {
      return request(`/examinations/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    },

    async create(
      payload: {
        age: number;
        sex: string;
        chief_complaint: string;
        known_conditions?: string; // stringified JSON
        photoUri: string;
        photoName?: string;
        photoType?: string;
      },
      token: string
    ) {
      const formData = new FormData();
      formData.append('age', payload.age.toString());
      formData.append('sex', payload.sex);
      formData.append('chief_complaint', payload.chief_complaint);
      
      if (payload.known_conditions) {
        formData.append('known_conditions', payload.known_conditions);
      }

      const uri = payload.photoUri;
      const uriParts = uri.split('.');
      const fileExt = uriParts[uriParts.length - 1].toLowerCase();
      const name = payload.photoName || `photo-${Date.now()}.${fileExt}`;
      const type = payload.photoType || `image/${fileExt === 'png' ? 'png' : 'jpeg'}`;

      try {
        // Đọc file thành Blob bằng XMLHttpRequest
        const blob: any = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.onload = function () {
            resolve(xhr.response);
          };
          xhr.onerror = function (e) {
            reject(new TypeError("Network request failed"));
          };
          xhr.responseType = "blob";
          xhr.open("GET", uri, true);
          xhr.send(null);
        });

        // Đảm bảo Blob có type chính xác để Backend không từ chối
        const finalFile = new Blob([blob], { type });
        formData.append('photo', finalFile, name);
      } catch (e) {
        console.error('Failed to prepare photo blob:', e);
        throw new Error('Could not process photo for upload.');
      }

      return request('/examinations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });
    },

    async markUrgent(id: number | string, token: string) {
      return request(`/examinations/${id}/urgent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    }
  },

  notifications: {
    async list(token: string) {
      return request('/notifications', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    },

    async read(id: number | string, token: string) {
      return request(`/notifications/${id}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    },

    async readAll(token: string) {
      return request('/notifications/read-all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    }
  }
};
