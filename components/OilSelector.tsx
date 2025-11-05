import React, { useState, useEffect } from 'react';
import type { SelectedOil } from '../types';
import { OILS } from '../constants/oils';
import { PlusIcon, TrashIcon } from './icons';

interface OilSelectorProps {
    selectedOils: SelectedOil[];
    setSelectedOils: React.Dispatch<React.SetStateAction<SelectedOil[]>>;
}

export const OilSelector: React.FC<OilSelectorProps> = ({ selectedOils, setSelectedOils }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [checkedOils, setCheckedOils] = useState<Set<string>>(new Set());

    const totalWeight = selectedOils.reduce((sum, item) => sum + item.weight, 0);

    useEffect(() => {
        if (isModalOpen) {
            setCheckedOils(new Set(selectedOils.map(item => item.oil.name)));
        }
    }, [isModalOpen, selectedOils]);

    const handleWeightChange = (index: number, newWeight: number) => {
        const newSelectedOils = [...selectedOils];
        newSelectedOils[index].weight = newWeight >= 0 ? newWeight : 0;
        setSelectedOils(newSelectedOils);
    };

    const removeOil = (index: number) => {
        if (selectedOils.length > 1) {
            const newSelectedOils = selectedOils.filter((_, i) => i !== index);
            setSelectedOils(newSelectedOils);
        }
    };

    const handleModalCheckboxChange = (oilName: string, isChecked: boolean) => {
        const newCheckedOils = new Set(checkedOils);
        if (isChecked) {
            newCheckedOils.add(oilName);
        } else {
            newCheckedOils.delete(oilName);
        }
        setCheckedOils(newCheckedOils);
    };

    const handleModalSave = () => {
        const newSelectedOils: SelectedOil[] = [];
        const existingOilsMap = new Map<string, number>();
        selectedOils.forEach(item => {
            existingOilsMap.set(item.oil.name, item.weight);
        });

        checkedOils.forEach(name => {
            const oilData = OILS.find(o => o.name === name);
            if (oilData) {
                newSelectedOils.push({
                    oil: oilData,
                    weight: existingOilsMap.get(name) || 0
                });
            }
        });

        if (newSelectedOils.length === 0) {
            newSelectedOils.push({ oil: OILS[0], weight: 100 });
        }

        setSelectedOils(newSelectedOils);
        setIsModalOpen(false);
    };

    return (
        <div>
            <h3 className="text-xl font-semibold mb-3 text-emerald-600">오일 선택 및 무게 (g)</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {selectedOils.map((item, index) => (
                    <div key={item.oil.name} className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-stone-200">
                        <span className="flex-grow font-medium text-stone-700 truncate pr-2" title={item.oil.name}>
                            {item.oil.name}
                        </span>
                        <input
                            type="number"
                            value={item.weight}
                            onChange={(e) => handleWeightChange(index, Number(e.target.value))}
                            className="block w-16 rounded-md bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm focus:bg-white focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 text-right"
                            min="0"
                        />
                         <button
                            onClick={() => removeOil(index)}
                            disabled={selectedOils.length <= 1}
                            className="p-2 text-stone-500 hover:text-red-600 disabled:text-stone-300 disabled:cursor-not-allowed transition-colors"
                            aria-label="Remove oil"
                        >
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                ))}
            </div>
             <div className="mt-4 flex justify-between items-center bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                <span className="font-bold text-emerald-800">총 오일 무게</span>
                <span className="font-bold text-xl text-emerald-900">{totalWeight.toFixed(0)} g</span>
            </div>
            <button
                onClick={() => setIsModalOpen(true)}
                className="mt-3 w-full flex items-center justify-center space-x-2 border-2 border-dashed border-emerald-400 text-emerald-600 font-semibold py-2 px-4 rounded-lg hover:bg-emerald-50 transition duration-200"
            >
                <PlusIcon className="w-5 h-5" />
                <span>오일 목록 한번에 선택/편집하기</span>
            </button>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col">
                        <h4 className="text-xl font-bold p-6 border-b text-emerald-800">오일 선택하기</h4>
                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                {OILS.map(oil => (
                                    <label key={oil.name} className="flex items-center space-x-3 p-2 rounded-md hover:bg-stone-100 cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            className="h-5 w-5 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                                            checked={checkedOils.has(oil.name)}
                                            onChange={(e) => handleModalCheckboxChange(oil.name, e.target.checked)}
                                        />
                                        <span className="text-stone-700 select-none">{oil.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end space-x-4 p-4 bg-stone-50 rounded-b-xl border-t">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-stone-700 bg-stone-200 hover:bg-stone-300 transition-colors font-semibold">취소</button>
                            <button onClick={handleModalSave} className="px-6 py-2 rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 transition-colors font-semibold">선택 완료</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};