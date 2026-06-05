// src/utils/constants.js

export const ORE_DATABASE = {
  SULFIDES: ["Chalcopyrite (Cu)", "Galena (Pb)", "Sphalerite (Zn)", "Pyrite (Fe)"],
  OXIDES: ["Hematite (Fe)", "Magnetite (Fe)", "Chromite (Cr)", "Bauxite (Al)"],
  NATIVE: ["Gold (Au)", "Silver (Ag)", "Copper (Cu)"],
  CARBONATES: ["Malachite (Cu)", "Azurite (Cu)", "Calcite (Ca)"]
};

export const normalizeCompany = (value) => {
  if (value == null || typeof value !== 'string') return '';
  return value.trim().toUpperCase();
};

export const isAdminRole = (roleValue) => {
  if (!roleValue || typeof roleValue !== 'string') return false;
  return roleValue.trim().toLowerCase() === 'admin';
};