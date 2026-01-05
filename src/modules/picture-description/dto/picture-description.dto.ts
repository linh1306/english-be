import { PictureDescription } from '../../../generated/prisma/client';
import { Body, BodyPartial, Query } from '../../../core/types';

export type BodyCreatePictureDescription = Body<
  PictureDescription,
  'description' | 'partsEn' | 'partsVi' | 'imageUrl'
>;

export type BodyUpdatePictureDescription = BodyPartial<
  PictureDescription,
  'description' | 'partsEn' | 'partsVi' | 'imageUrl' | 'isActive'
>;

export type QueryGetPicturesDescription = Query<
  PictureDescription,
  'isActive',
  'createdAt'
>;

export type BodyGeneratePictureDescription = {
  context?: string; // Chủ đề/ngữ cảnh (Optional - Auto APTIS style if empty)
  count?: number; // Số lượng cần tạo (default 1)
};

export type BodySubmitAnswer = {
  answer: string; // Câu trả lời của user
};

export type BodyDeletePictureDescriptions = {
  ids: string[];
};
