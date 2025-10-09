import businessKeywords from '../data/subjects/business.json';
import careerTechKeywords from '../data/subjects/career_tech.json';
import fitnessKeywords from '../data/subjects/fitness.json';
import historyKeywords from '../data/subjects/history.json';
import languageKeywords from '../data/subjects/language.json';
import literatureKeywords from '../data/subjects/literature.json';
import mathKeywords from '../data/subjects/math.json';
import musicArtsKeywords from '../data/subjects/music_arts.json';
import scienceKeywords from '../data/subjects/science.json';
import technologyKeywords from '../data/subjects/technology.json';

const subjectMap = {
  Math: mathKeywords,
  Science: scienceKeywords,
  Literature: literatureKeywords,
  History: historyKeywords,
  Language: languageKeywords,
  Technology: technologyKeywords,
  Business: businessKeywords,
  'Music & Arts': musicArtsKeywords,
  Fitness: fitnessKeywords,
  'Career & Technical Ed': careerTechKeywords,
};

export const mapToCoreSubject = (subject: string): string => {
  const s = subject.toLowerCase();
  let bestMatch = '';
  let bestCoreSubject = '';

  for (const [coreSubject, keywords] of Object.entries(subjectMap)) {
    for (const keyword of keywords) {
      if (s.includes(keyword) && keyword.length > bestMatch.length) {
        bestMatch = keyword;
        bestCoreSubject = coreSubject;
      }
    }
  }

  if (bestCoreSubject) {
    return bestCoreSubject;
  }

  // Fallback for subjects that do not match any keywords
  return 'Technology';
};
