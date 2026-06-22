export interface ConditionGroup {
  key: string;
  title: string;
  options: string[];
}

export const CONDITION_GROUPS: ConditionGroup[] = [
  {
    key: 'chronic',
    title: 'Bệnh mãn tính',
    options: ['Tiểu đường', 'Tuyến giáp', 'Gan', 'Thận'],
  },
  {
    key: 'autoimmune',
    title: 'Bệnh tự miễn',
    options: ['Lupus', 'Vảy nến', 'Viêm khớp'],
  },
  {
    key: 'infectious',
    title: 'Bệnh truyền nhiễm',
    options: ['Herpes', 'Thủy đậu', 'STDs'],
  },
  {
    key: 'allergy',
    title: 'Dị ứng',
    options: ['Thuốc', 'Thực phẩm', 'Mỹ phẩm', 'Thời tiết'],
  },
  {
    key: 'family',
    title: 'Tiền sử gia đình',
    options: ['Ung thư da', 'Chàm', 'Vảy nến'],
  },
];
