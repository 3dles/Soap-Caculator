export interface EssentialOilAdditive {
    name: string;
    weight: number;
}

export interface PowderAdditive {
    name: string;
    weight: number;
}

export interface FattyAcidProfile {
    lauric: number;
    myristic: number;
    palmitic: number;
    stearic: number;
    ricinoleic: number;
    oleic: number;
    linoleic: number;
    linolenic: number;
}

export interface Oil {
    name: string;
    sap: number;
    ins: number;
    fattyAcids: FattyAcidProfile;
}

export interface SelectedOil {
    oil: Oil;
    weight: number;
}

export interface SoapProperties {
    hardness: number;
    cleansing: number;
    conditioning: number;
    bubbly: number;
    creamy: number;
    ins: number;
    totalWeight: number;
    lyeAmount: number;
    waterAmount: number;
}

export interface CalculationResults {
    properties: SoapProperties;
    fattyAcidProfile: FattyAcidProfile;
    description: string;
    essentialOils: EssentialOilAdditive[];
    powders: PowderAdditive[];
}

export interface SavedRecipe {
    id: string;
    name: string;
    oils: SelectedOil[];
    superfat: number;
    waterAsPercentOfOils: number;
    essentialOils: EssentialOilAdditive[];
    powders: PowderAdditive[];
    results: CalculationResults;
}