// Extract deliverables from task form configuration
export const getTaskFormDeliverables = () => {
  return [
    { name: "game preview", timePerUnit: 15, timeUnit: "min", requiresQuantity: true, declinariTime: 10 },
    { name: "promo pack", timePerUnit: 3.5, timeUnit: "hr", requiresQuantity: true, declinariTime: 10 },
    { name: "simple design", timePerUnit: 1, timeUnit: "hr", requiresQuantity: true, declinariTime: 10 },
    { name: "Newsletter update", timePerUnit: 20, timeUnit: "min", requiresQuantity: true, declinariTime: 10 },
    { name: "Newsletter new design", timePerUnit: 2, timeUnit: "hr", requiresQuantity: true, declinariTime: 10 },
    { name: "landing page", timePerUnit: 8, timeUnit: "hr", requiresQuantity: true, declinariTime: 10 },
    { name: "banner new design", timePerUnit: 2, timeUnit: "hr", requiresQuantity: true, declinariTime: 10 },
    { name: "banner update", timePerUnit: 20, timeUnit: "min", requiresQuantity: true, declinariTime: 10 },
    { name: "minigame", timePerUnit: 4, timeUnit: "days", requiresQuantity: true, declinariTime: 10 },
    { name: "social media new design", timePerUnit: 3, timeUnit: "hr", requiresQuantity: true, declinariTime: 10 },
    { name: "sport campaign", timePerUnit: 2.5, timeUnit: "hr", requiresQuantity: true, declinariTime: 10 }
  ];
};

// Convert task form deliverables to settings format
export const convertToSettingsFormat = (deliverables) => {
  return deliverables.map(deliverable => ({
    name: deliverable.name,
    timePerUnit: deliverable.timePerUnit,
    timeUnit: deliverable.timeUnit,
    requiresQuantity: deliverable.requiresQuantity,
    declinariTime: deliverable.declinariTime
  }));
};
