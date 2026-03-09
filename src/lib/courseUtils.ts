export function getCourseProgressStats(
  progress: Record<string, any> = {},
  units: any[] = []
) {
  let totalLessons = units.reduce((acc, u) => {
    const list = u.lessons || u.lecciones || [];
    return acc + (Array.isArray(list) ? list.length : 0);
  }, 0);

  if (!totalLessons && progress) {
    const lessonBases = new Set<string>();
    Object.keys(progress).forEach(key => {
      if (!key || key === "[object Object]") return;
      const parts = key.split("::");
      if (parts.length >= 2) lessonBases.add(`${parts[0]}::${parts[1]}`);
    });
    totalLessons = lessonBases.size;
  }

  const baseMap = new Map<string, boolean>();
  Object.entries(progress).forEach(([key, value]: [string, any]) => {
    if (!key || key === "[object Object]") return;
    const parts = key.split("::");
    if (parts.length < 2) return;
    const baseKey = `${parts[0]}::${parts[1]}`;
    const isCompleted = value?.videoEnded === true || value?.exSubmitted === true || value?.completed === true;
    baseMap.set(baseKey, (baseMap.get(baseKey) || false) || isCompleted);
  });

  const completedCount = Array.from(baseMap.values()).filter(Boolean).length;
  const progressPercent = totalLessons > 0 ? Math.min(100, Math.round((completedCount / totalLessons) * 100)) : 0;

  return { totalLessons, completedCount, progressPercent };
}