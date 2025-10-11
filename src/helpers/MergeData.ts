export const mergeDataOfAlerts = (vehicleData: any[], vinData: any[]) => {
  // Merge both arrays
  const mergedData = [...(vehicleData || []), ...(vinData || [])];

  // Sort by vin asc and titleBrandDate desc
  mergedData.sort((a, b) => {
    // Compare VINs
    if ((a.vin || "") < (b.vin || "")) return -1;
    if ((a.vin || "") > (b.vin || "")) return 1;

    // VINs equal, compare titleBrandDate (desc)
    const dateA = a.titleBrandDate ? new Date(a.titleBrandDate) : new Date(0);
    const dateB = b.titleBrandDate ? new Date(b.titleBrandDate) : new Date(0);

    return dateB.getTime() - dateA.getTime();
  });

  return mergedData;
};
