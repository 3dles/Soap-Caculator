import React, { useState, useEffect, useCallback } from 'react';
import { OilSelector } from './components/OilSelector';
import { ResultsDisplay } from './components/ResultsDisplay';
import { OILS } from './constants/oils';
import { generateSoapDescription } from './services/geminiService';
import type { SelectedOil, SoapProperties, FattyAcidProfile, CalculationResults, SavedRecipe, EssentialOilAdditive, PowderAdditive } from './types';
import { TrashIcon, LoadIcon, PlusIcon } from './components/icons';

function App() {
    const [selectedOils, setSelectedOils] = useState<SelectedOil[]>([
        { oil: OILS.find(o => o.name === '올리브 오일 (Olive Oil)')!, weight: 500 },
        { oil: OILS.find(o => o.name === '코코넛 오일 (Coconut Oil)')!, weight: 300 },
        { oil: OILS.find(o => o.name === '팜 오일 (Palm Oil)')!, weight: 200 },
    ]);
    const [superfat, setSuperfat] = useState(5);
    const [waterAsPercentOfOils, setWaterAsPercentOfOils] = useState(33);
    const [essentialOils, setEssentialOils] = useState<EssentialOilAdditive[]>([{ name: '', weight: 0 }]);
    const [powders, setPowders] = useState<PowderAdditive[]>([{ name: '', weight: 0 }]);

    const [currentResults, setCurrentResults] = useState<CalculationResults | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

    const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);

    useEffect(() => {
        try {
            const storedRecipes = localStorage.getItem('soapRecipes');
            if (storedRecipes) {
                setSavedRecipes(JSON.parse(storedRecipes));
            }
        } catch (error) {
            console.error("Failed to load recipes from localStorage:", error);
        }
    }, []);
    
    const handleEssentialOilChange = (index: number, field: 'name' | 'weight', value: string | number) => {
        const newEssentialOils = [...essentialOils];
        if (field === 'weight') {
            newEssentialOils[index][field] = Number(value) >= 0 ? Number(value) : 0;
        } else {
            newEssentialOils[index][field] = value as string;
        }
        setEssentialOils(newEssentialOils);
    };

    const addEssentialOil = () => {
        if (essentialOils.length < 3) {
            setEssentialOils([...essentialOils, { name: '', weight: 0 }]);
        }
    };

    const removeEssentialOil = (index: number) => {
        if (essentialOils.length > 1) {
            const newEssentialOils = essentialOils.filter((_, i) => i !== index);
            setEssentialOils(newEssentialOils);
        } else {
            setEssentialOils([{ name: '', weight: 0 }]);
        }
    };

    const handlePowderChange = (index: number, field: 'name' | 'weight', value: string | number) => {
        const newPowders = [...powders];
        if (field === 'weight') {
            newPowders[index][field] = Number(value) >= 0 ? Number(value) : 0;
        } else {
            newPowders[index][field] = value as string;
        }
        setPowders(newPowders);
    };

    const addPowder = () => {
        if (powders.length < 3) {
            setPowders([...powders, { name: '', weight: 0 }]);
        }
    };

    const removePowder = (index: number) => {
        if (powders.length > 1) {
            const newPowders = powders.filter((_, i) => i !== index);
            setPowders(newPowders);
        } else {
            setPowders([{ name: '', weight: 0 }]);
        }
    };


    const handleCalculate = useCallback(async () => {
        setIsCalculating(true);
        setIsGeneratingDescription(true);
        setCurrentResults(null);

        const totalWeight = selectedOils.reduce((sum, item) => sum + item.weight, 0);
        if (totalWeight === 0) {
            setIsCalculating(false);
            setIsGeneratingDescription(false);
            return;
        }

        const initialFattyAcids: FattyAcidProfile = { lauric: 0, myristic: 0, palmitic: 0, stearic: 0, ricinoleic: 0, oleic: 0, linoleic: 0, linolenic: 0 };
        
        const calculatedFattyAcidProfile = selectedOils.reduce((profile, item) => {
            const percentage = item.weight / totalWeight;
            for (const key in item.oil.fattyAcids) {
                profile[key as keyof FattyAcidProfile] += item.oil.fattyAcids[key as keyof FattyAcidProfile] * percentage;
            }
            return profile;
        }, {...initialFattyAcids});

        const properties = {
            hardness: calculatedFattyAcidProfile.lauric + calculatedFattyAcidProfile.myristic + calculatedFattyAcidProfile.palmitic + calculatedFattyAcidProfile.stearic,
            cleansing: calculatedFattyAcidProfile.lauric + calculatedFattyAcidProfile.myristic,
            conditioning: calculatedFattyAcidProfile.oleic + calculatedFattyAcidProfile.linoleic + calculatedFattyAcidProfile.linolenic + calculatedFattyAcidProfile.ricinoleic,
            bubbly: calculatedFattyAcidProfile.lauric + calculatedFattyAcidProfile.myristic + calculatedFattyAcidProfile.ricinoleic,
            creamy: calculatedFattyAcidProfile.palmitic + calculatedFattyAcidProfile.stearic + calculatedFattyAcidProfile.ricinoleic,
        };
        
        const ins = selectedOils.reduce((sum, item) => sum + item.oil.ins * (item.weight / totalWeight), 0);
        const totalLye = selectedOils.reduce((sum, item) => sum + item.weight * item.oil.sap, 0);
        const lyeAmount = totalLye * (1 - superfat / 100);
        const waterAmount = totalWeight * (waterAsPercentOfOils / 100);

        const calculatedProperties: SoapProperties = {
            ...properties, ins, totalWeight, lyeAmount, waterAmount
        };
        
        setCurrentResults({
            properties: calculatedProperties,
            fattyAcidProfile: calculatedFattyAcidProfile,
            description: '분석 중...',
            essentialOils: essentialOils.filter(eo => eo.weight > 0 && eo.name.trim() !== ''),
            powders: powders.filter(p => p.weight > 0 && p.name.trim() !== ''),
        });
        setIsCalculating(false);

        try {
            const description = await generateSoapDescription(calculatedProperties, calculatedFattyAcidProfile, selectedOils, essentialOils, powders);
            setCurrentResults(prev => prev ? { ...prev, description } : null);
        } catch (error) {
            console.error("Error generating description:", error);
            setCurrentResults(prev => prev ? { ...prev, description: '오류: 비누 특징을 생성하는 데 실패했습니다.' } : null);
        } finally {
            setIsGeneratingDescription(false);
        }
    }, [selectedOils, superfat, waterAsPercentOfOils, essentialOils, powders]);

    const handleSaveRecipe = () => {
        if (!currentResults || isGeneratingDescription) return;
        const recipeName = prompt("레시피 이름을 입력하세요:", `레시피 ${new Date().toLocaleString()}`);
        if (recipeName) {
            const newRecipe: SavedRecipe = {
                id: crypto.randomUUID(),
                name: recipeName,
                oils: selectedOils,
                superfat: superfat,
                waterAsPercentOfOils: waterAsPercentOfOils,
                essentialOils: essentialOils.filter(eo => eo.weight > 0 && eo.name.trim() !== ''),
                powders: powders.filter(p => p.weight > 0 && p.name.trim() !== ''),
                results: currentResults,
            };
            const updatedRecipes = [...savedRecipes, newRecipe];
            setSavedRecipes(updatedRecipes);
            try {
                localStorage.setItem('soapRecipes', JSON.stringify(updatedRecipes));
            } catch (error) {
                console.error("Failed to save recipes to localStorage:", error);
            }
        }
    };

    const handleLoadRecipe = (recipeId: string) => {
        const recipeToLoad = savedRecipes.find(r => r.id === recipeId);
        if (recipeToLoad) {
            setSelectedOils(recipeToLoad.oils);
            setSuperfat(recipeToLoad.superfat);
            setWaterAsPercentOfOils(recipeToLoad.waterAsPercentOfOils || 33);
            if (recipeToLoad.essentialOils && recipeToLoad.essentialOils.length > 0) {
                setEssentialOils(recipeToLoad.essentialOils);
            } else if ((recipeToLoad as any).essentialOilWeight > 0) { // Backward compatibility
                setEssentialOils([{ name: '에센셜 오일', weight: (recipeToLoad as any).essentialOilWeight }]);
            } else {
                 setEssentialOils([{ name: '', weight: 0 }]);
            }
            if (recipeToLoad.powders && recipeToLoad.powders.length > 0) {
                setPowders(recipeToLoad.powders);
            } else if ((recipeToLoad as any).powderWeight > 0) { // Backward compatibility
                setPowders([{ name: '천연 분말', weight: (recipeToLoad as any).powderWeight }]);
            } else {
                setPowders([{ name: '', weight: 0 }]);
            }
            setCurrentResults(recipeToLoad.results);
        }
    };

    const handleDeleteRecipe = (recipeId: string) => {
        if (confirm("정말로 이 레시피를 삭제하시겠습니까?")) {
            const updatedRecipes = savedRecipes.filter(r => r.id !== recipeId);
            setSavedRecipes(updatedRecipes);
             try {
                localStorage.setItem('soapRecipes', JSON.stringify(updatedRecipes));
            } catch (error) {
                console.error("Failed to delete recipe from localStorage:", error);
            }
        }
    };


    return (
        <div className="bg-stone-50 min-h-screen font-sans">
            <header className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-4">
                    <h1 className="text-3xl font-bold text-emerald-700">CP 비누 레시피 계산기</h1>
                    <p className="text-stone-500 mt-1">오일, 첨가물 등을 조절하여 완벽한 비누 레시피를 만들어보세요.</p>
                </div>
            </header>
            <main className="container mx-auto p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column for settings */}
                    <div className="md:col-span-1 space-y-6">
                         <div className="bg-white p-6 rounded-xl border border-stone-200">
                            <OilSelector selectedOils={selectedOils} setSelectedOils={setSelectedOils} />
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-stone-200">
                             <h3 className="text-xl font-semibold mb-3 text-emerald-600">계산 설정</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="superfat" className="block text-sm font-medium text-stone-700">가성소다 디스카운트 (%)</label>
                                    <input
                                        type="number"
                                        id="superfat"
                                        value={superfat}
                                        onChange={(e) => setSuperfat(Number(e.target.value))}
                                        className="mt-1 block w-full rounded-md bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm focus:bg-white focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2"
                                        min="0"
                                        max="20"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="waterAsPercentOfOils" className="block text-sm font-medium text-stone-700">오일 대비 물 비율 (%)</label>
                                    <input
                                        type="number"
                                        id="waterAsPercentOfOils"
                                        value={waterAsPercentOfOils}
                                        onChange={(e) => setWaterAsPercentOfOils(Number(e.target.value))}
                                        className="mt-1 block w-full rounded-md bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm focus:bg-white focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2"
                                        min="20"
                                        max="50"
                                        step="1"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-stone-200">
                             <h3 className="text-xl font-semibold mb-3 text-emerald-600">기타 첨가물 (선택 사항)</h3>
                             <div className="space-y-4">
                                <div className="space-y-3">
                                    {essentialOils.map((eo, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                            <div className="col-span-6">
                                                {index === 0 && <label className="block text-sm font-medium text-stone-700">에센셜 오일</label>}
                                                <input
                                                    type="text"
                                                    placeholder="오일 이름"
                                                    value={eo.name}
                                                    onChange={(e) => handleEssentialOilChange(index, 'name', e.target.value)}
                                                    className="mt-1 block w-full rounded-md bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm focus:bg-white focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2"
                                                />
                                            </div>
                                            <div className="col-span-4">
                                                {index === 0 && <label className="block text-sm font-medium text-stone-700">무게 (g)</label>}
                                                <input
                                                    type="number"
                                                    value={eo.weight}
                                                    onChange={(e) => handleEssentialOilChange(index, 'weight', e.target.value)}
                                                    className="mt-1 block w-full rounded-md bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm focus:bg-white focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2"
                                                    min="0"
                                                />
                                            </div>
                                            <div className="col-span-2 flex items-end h-full">
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeEssentialOil(index)}
                                                    className="mt-1 p-2 text-stone-500 hover:text-red-600"
                                                    aria-label="Remove essential oil"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {essentialOils.length < 3 && (
                                        <button 
                                            type="button" 
                                            onClick={addEssentialOil} 
                                            className="w-full text-sm flex items-center justify-center space-x-1 border border-dashed border-emerald-400 text-emerald-600 font-semibold py-1 px-2 rounded-lg hover:bg-emerald-50 transition duration-200"
                                        >
                                            <PlusIcon className="w-4 h-4" />
                                            <span>에센셜 오일 추가</span>
                                        </button>
                                    )}
                                </div>
                                 <div className="space-y-3">
                                    {powders.map((p, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                            <div className="col-span-6">
                                                {index === 0 && <label className="block text-sm font-medium text-stone-700">천연 분말</label>}
                                                <input
                                                    type="text"
                                                    placeholder="분말 이름"
                                                    value={p.name}
                                                    onChange={(e) => handlePowderChange(index, 'name', e.target.value)}
                                                    className="mt-1 block w-full rounded-md bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm focus:bg-white focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2"
                                                />
                                            </div>
                                            <div className="col-span-4">
                                                {index === 0 && <label className="block text-sm font-medium text-stone-700">무게 (g)</label>}
                                                <input
                                                    type="number"
                                                    value={p.weight}
                                                    onChange={(e) => handlePowderChange(index, 'weight', e.target.value)}
                                                    className="mt-1 block w-full rounded-md bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm focus:bg-white focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2"
                                                    min="0"
                                                />
                                            </div>
                                            <div className="col-span-2 flex items-end h-full">
                                                <button 
                                                    type="button" 
                                                    onClick={() => removePowder(index)}
                                                    className="mt-1 p-2 text-stone-500 hover:text-red-600"
                                                    aria-label="Remove powder"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {powders.length < 3 && (
                                        <button 
                                            type="button" 
                                            onClick={addPowder} 
                                            className="w-full text-sm flex items-center justify-center space-x-1 border border-dashed border-emerald-400 text-emerald-600 font-semibold py-1 px-2 rounded-lg hover:bg-emerald-50 transition duration-200"
                                        >
                                            <PlusIcon className="w-4 h-4" />
                                            <span>천연 분말 추가</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleCalculate}
                            disabled={isCalculating || selectedOils.reduce((sum, item) => sum + item.weight, 0) === 0}
                            className="w-full bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-emerald-700 disabled:bg-emerald-300 transition duration-200 text-lg"
                        >
                            {isCalculating ? '계산 중...' : '레시피 계산하기'}
                        </button>
                         {savedRecipes.length > 0 && (
                            <div className="bg-white p-6 rounded-xl border border-stone-200">
                                <h3 className="text-xl font-semibold mb-3 text-emerald-600">저장된 레시피</h3>
                                <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                    {savedRecipes.map(recipe => (
                                        <li key={recipe.id} className="flex justify-between items-center bg-stone-50 p-2 rounded-md">
                                            <span className="truncate text-stone-700" title={recipe.name}>{recipe.name}</span>
                                            <div className="flex space-x-2">
                                                <button onClick={() => handleLoadRecipe(recipe.id)} className="p-1 text-stone-500 hover:text-emerald-600" title="불러오기">
                                                    <LoadIcon className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => handleDeleteRecipe(recipe.id)} className="p-1 text-stone-500 hover:text-red-600" title="삭제">
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                         )}
                    </div>
                    {/* Right Column for results */}
                    <div className="md:col-span-2">
                        {currentResults ? (
                            <ResultsDisplay
                                results={currentResults}
                                onSave={handleSaveRecipe}
                                isGeneratingDescription={isGeneratingDescription}
                            />
                        ) : (
                             <div className="bg-white p-8 rounded-xl border border-stone-200 text-center h-full flex flex-col justify-center">
                                <h3 className="text-2xl font-bold text-emerald-700 mb-2">레시피를 계산해보세요</h3>
                                <p className="text-stone-500">오일을 선택하고 '레시피 계산하기' 버튼을 눌러주세요.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;