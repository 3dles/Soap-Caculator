import { GoogleGenAI } from "@google/genai";
import type { EssentialOilAdditive, FattyAcidProfile, PowderAdditive, SelectedOil, SoapProperties } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSoapDescription = async (
    properties: SoapProperties,
    fattyAcids: FattyAcidProfile,
    selectedOils: SelectedOil[],
    essentialOils: EssentialOilAdditive[],
    powders: PowderAdditive[]
) => {
    const model = "gemini-2.5-flash";
    const topFattyAcids = Object.entries(fattyAcids)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 3)
        .map(([key, value]) => `${key}: ${(value as number).toFixed(1)}%`)
        .join(', ');
        
    const topOils = selectedOils
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 3)
        .map(item => item.oil.name.split(' (')[0])
        .join(', ');

    let additivesPrompt = '';
    const validEOs = essentialOils.filter(eo => eo.weight > 0 && eo.name.trim() !== '');
    if (validEOs.length > 0) {
        const eoList = validEOs.map(eo => `${eo.name} (${eo.weight}g)`).join(', ');
        additivesPrompt += `Essential Oils: ${eoList}. `;
    }

    const validPowders = powders.filter(p => p.weight > 0 && p.name.trim() !== '');
    if (validPowders.length > 0) {
        const powderList = validPowders.map(p => `${p.name} (${p.weight}g)`).join(', ');
        additivesPrompt += `Powders: ${powderList}.`;
    }

    if (additivesPrompt.trim() === '') {
        additivesPrompt = 'None';
    }


    const prompt = `
        You are an expert soap maker providing a concise analysis of a cold process soap recipe.
        The user wants a summary of their recipe. Provide the response in Korean.
        Do not use markdown tables. Do not use any markdown formatting for the "비누 핵심 특징" section, just plain text with emojis.
        For "상세 설명", you can use markdown bold for emphasis (e.g., **올레산**).

        Here is the data for the recipe:
        - Key Oils: ${topOils}
        - Key Fatty Acids: ${topFattyAcids}
        - Calculated Properties: hardness=${properties.hardness.toFixed(0)}, cleansing=${properties.cleansing.toFixed(0)}, conditioning=${properties.conditioning.toFixed(0)}, bubbly=${properties.bubbly.toFixed(0)}, creamy=${properties.creamy.toFixed(0)}
        - Additives: ${additivesPrompt}

        Based on this data, provide the following information in this exact format:

        ### ✨ 비누 핵심 특징
        - 단단함: [단단함/무름/보통 중 하나]
        - 세정력: [강함/순함/보통 중 하나]
        - 거품타입: [크고 성긴 거품/작고 쫀쫀한 거품/크리미한 거품 중 하나]

        ### 📝 상세 설명
        [First, based on the key oils and fatty acids, provide a short, insightful explanation. For example: "이 레시피는 **${topOils.split(', ')[0]}**에서 유래한 **${topFattyAcids.split(', ')[0].split(':')[0]}산**이 풍부하여 보습력이 뛰어나고, **${topOils.split(', ')[1]}**의 **${topFattyAcids.split(', ')[1].split(':')[0]}산**이 비누를 단단하게 만들고 풍성한 거품을 내는 데 도움을 줍니다." 
        Then, if additives are present, provide a detailed explanation of their effects.
        - For essential oils, explain the role of their key chemical components (e.g., "라벤더 오일의 **리날룰** 성분은 심신을 안정시키는 향을 제공하며 피부 진정 효과를 줄 수 있습니다.").
        - For natural powders, describe their specific effects on the skin (e.g., "핑크 클레이 분말은 피부의 노폐물을 부드럽게 흡착하고 정화하는 효과가 있습니다."). Merge this explanation smoothly with the fatty acid explanation.]

        ### 🎯 추천 요약
        - 추천 피부 타입: [건성/지성/복합성/모든피부 중 하나]
        - 추천 사용 대상: [유아/민감성 피부/성인/강아지 등 구체적인 대상]
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        // Using response.text as it is the most direct way to get the text output.
        return response.text.trim();
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to get description from Gemini.");
    }
};