export function buildManualNdc(labelerCode, productCode, packageCode) {
  return `${String(labelerCode || '70095').trim()}-${String(productCode || '').trim()}-${String(packageCode || '').trim()}`;
}

export function validateAssignedCodes(existingNdcList = [], labelerCode, productCode, packageCode) {
  const ndc = buildManualNdc(labelerCode, productCode, packageCode);
  const exists = (existingNdcList || []).some((code) => String(code).trim() === ndc);

  if (exists) {
    return {
      isValid: false,
      ndc,
      message: `NDC ${ndc} already exists in the registry.`
    };
  }

  return {
    isValid: true,
    ndc,
    message: 'NDC is unique and available.'
  };
}
