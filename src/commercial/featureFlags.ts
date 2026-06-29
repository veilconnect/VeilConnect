declare const __VC_COMMERCIAL_ENABLED__: boolean | undefined;

export function commercialFeaturesEnabled(): boolean {
  try {
    return typeof __VC_COMMERCIAL_ENABLED__ === 'boolean' ? __VC_COMMERCIAL_ENABLED__ : false;
  } catch {
    return false;
  }
}
