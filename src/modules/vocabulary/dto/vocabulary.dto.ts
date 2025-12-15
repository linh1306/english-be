import { Vocabulary } from '../../../generated/prisma/client';
import { Body, BodyPartial, Query } from '../../../core/types';

export type BodyCreateVocabulary = Body<
    Vocabulary,
    'word' | 'meaning' | 'topicId' | 'pronunciation' | 'audioUrl' | 'partOfSpeech' |
    'exampleEn' | 'exampleVi' | 'imageUrl' | 'synonyms' | 'antonyms'
>;

export type BodyUpdateVocabulary = BodyPartial<
    Vocabulary,
    'word' | 'meaning' | 'topicId' | 'pronunciation' | 'audioUrl' | 'partOfSpeech' |
    'exampleEn' | 'exampleVi' | 'imageUrl' | 'synonyms' | 'antonyms'
>;

export type QueryFindAllVocabulary = Query<
    Vocabulary,
    'topicId' | 'partOfSpeech',
    'word' | 'createdAt'
>;

export type BodyGenerateVocabulary = {
    count: number;
};
