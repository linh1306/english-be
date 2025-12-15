import { Topic } from '../../../generated/prisma/client';
import { Body, BodyPartial, Query } from '../../../core/types';

export type BodyCreateTopic = Body<Topic, 'name' | 'description'>;

export type BodyUpdateTopic = BodyPartial<Topic, 'name' | 'description' | 'isActive'>;

export type QueryFindAllTopic = Query<Topic, 'isActive', 'name' | 'createdAt'>;
