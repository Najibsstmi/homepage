export function getSimulatorShareUrl(path) {
  if (typeof window === "undefined") {
    return path;
  }

  return new URL(path, window.location.origin).toString();
}

export async function shareSimulator(simulator) {
  const url = getSimulatorShareUrl(simulator.path);
  const shareData = {
    title: `${simulator.title} | EduSim`,
    text: `Jom cuba simulator "${simulator.title}" di EduSim CikguSTEM.`,
    url,
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return "shared";
    } catch (error) {
      if (error?.name === "AbortError") {
        return "cancelled";
      }
    }
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return "copied";
  }

  return "unsupported";
}
