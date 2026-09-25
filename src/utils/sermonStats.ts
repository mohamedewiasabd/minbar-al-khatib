import { Sermon } from '../types';

// Each series part counts as a separate sermon (a 5-part series = 5 sermons)
export function sermonCount(sermon: Sermon): number {
  if (sermon.isSeries) {
    const parts = sermon.seriesParts?.length || sermon.totalSeriesParts || 0;
    return parts > 0 ? parts : 1;
  }
  return 1;
}

// Total number of sermons including every part of every series
export function totalSermonCount(sermons: Sermon[]): number {
  return sermons.reduce((acc, s) => acc + sermonCount(s), 0);
}