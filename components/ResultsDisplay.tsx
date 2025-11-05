import React from 'react';
import type { CalculationResults } from '../types';
import { PROPERTY_RANGES, FATTY_ACID_NAMES } from '../constants/oils';
import { SaveIcon } from './icons';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';

interface ResultsDisplayProps {
    results: CalculationResults;
    onSave: () => void;
    isGeneratingDescription: boolean;
}

const PropertyBar: React.FC<{ value: number; min: number; max: number; name: string }> = ({ value, min, max, name }) => {
    const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);
    const inRange = value >= min && value <= max;
    const barColor = inRange ? 'bg-emerald-500' : 'bg-amber-500';

    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-stone-700">{name}</span>
                <span className={`text-sm font-bold ${inRange ? 'text-emerald-700' : 'text-amber-700'}`}>{value.toFixed(0)}</span>
            </div>
            <div className="w-full bg-stone-200 rounded-full h-2.5 relative">
                <div className={`${barColor} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
                <div className="absolute top-0 left-0 right-0 flex justify-between px-1 text-xs text-stone-500" style={{ top: '12px' }}>
                    <span>{min}</span>
                    <span>{max}</span>
                </div>
            </div>
        </div>
    );
};


export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, onSave, isGeneratingDescription }) => {
    const { properties, fattyAcidProfile, description, essentialOils, powders } = results;
    const totalOilWeight = properties.totalWeight;
    const totalEssentialOilWeight = essentialOils.reduce((sum, eo) => sum + eo.weight, 0);
    const totalPowderWeight = powders.reduce((sum, p) => sum + p.weight, 0);
    const totalAdditiveWeight = totalEssentialOilWeight + totalPowderWeight;
    const totalRecipeWeight = totalOilWeight + properties.waterAmount + properties.lyeAmount + totalAdditiveWeight;

    // Pie chart data and settings
    const pieData = Object.entries(fattyAcidProfile)
        .map(([key, value]) => ({
            name: FATTY_ACID_NAMES[key as keyof typeof FATTY_ACID_NAMES],
            value: Number((value as number).toFixed(1)),
        }))
        .filter(entry => entry.value > 0);

    const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#64748b'];

    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        if (!percent || percent * 100 < 4) return null;

        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="font-bold text-xs pointer-events-none">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    // Use a simple markdown-to-react parser for bold text.
    const renderDescription = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index}>{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };
    
    // Split description into sections
    const descriptionSections: { [key: string]: string } = {};
    const descriptionLines = description.split('\n').filter(line => line.trim() !== '');
    let currentSection = '';
    descriptionLines.forEach(line => {
        if (line.startsWith('### ')) {
            currentSection = line.replace('### ', '').trim();
            descriptionSections[currentSection] = '';
        } else if (currentSection) {
            descriptionSections[currentSection] += line + '\n';
        } else if (descriptionLines.length > 0 && !currentSection) {
            // Handle cases where description doesn't start with a header
            currentSection = 'analysis';
            descriptionSections[currentSection] = description;
        }
    });


    return (
        <div className="bg-white p-6 rounded-xl border border-stone-200 space-y-8 animate-fade-in">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-bold text-emerald-700">레시피 분석 결과</h2>
                    <p className="text-stone-500 mt-1">계산된 비누의 특성과 재료의 총량을 확인하세요.</p>
                </div>
                <button
                    onClick={onSave}
                    disabled={isGeneratingDescription}
                    className="flex items-center space-x-2 bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-700 disabled:bg-emerald-300 transition duration-200"
                >
                    <SaveIcon className="w-5 h-5" />
                    <span>레시피 저장</span>
                </button>
            </div>

            {/* Total Weights */}
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                <h3 className="text-xl font-semibold mb-4 text-emerald-800">재료 총량</h3>
                <div className="grid grid-cols-4 gap-x-4 text-center">
                    <div>
                        <p className="text-sm text-stone-600">총 오일</p>
                        <p className="text-lg font-bold text-emerald-900">{totalOilWeight.toFixed(1)} g</p>
                    </div>
                    <div>
                        <p className="text-sm text-stone-600">물</p>
                        <p className="text-lg font-bold text-emerald-900">{properties.waterAmount.toFixed(1)} g</p>
                    </div>
                    <div>
                        <p className="text-sm text-stone-600">가성소다</p>
                        <p className="text-lg font-bold text-emerald-900">{properties.lyeAmount.toFixed(1)} g</p>
                    </div>
                     <div>
                        <p className="text-sm text-stone-600">기타 첨가물</p>
                        <p className="text-lg font-bold text-emerald-900">{totalAdditiveWeight.toFixed(1)} g</p>
                    </div>
                </div>
                <hr className="border-emerald-200 my-4" />
                <div className="text-center">
                    <p className="text-sm text-stone-600">레시피 총량</p>
                    <p className="text-xl font-bold text-emerald-900">{totalRecipeWeight.toFixed(1)} g</p>
                </div>
            </div>


            {/* Gemini Description */}
             <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
                <h3 className="text-xl font-semibold mb-3 text-stone-800">Gemini AI 비누 분석</h3>
                {isGeneratingDescription ? (
                     <div className="flex items-center space-x-2 text-stone-500">
                        <div className="w-4 h-4 border-2 border-stone-400 border-t-transparent rounded-full animate-spin"></div>
                        <span>비누의 특징을 분석하고 있습니다...</span>
                    </div>
                ) : (
                    <div className="space-y-4 text-stone-700 whitespace-pre-wrap">
                       {Object.keys(descriptionSections).length > 0 ? Object.entries(descriptionSections).map(([title, content]) => (
                            <div key={title}>
                                {title !== 'analysis' && <h4 className="font-bold text-emerald-700 text-lg mb-1">{title}</h4>}
                                <div className={title !== 'analysis' ? "pl-2 border-l-4 border-emerald-200" : ""}>
                                    <p className="prose prose-sm">{renderDescription(content.trim())}</p>
                                </div>
                            </div>
                       )) : <p>{description}</p>}
                    </div>
                )}
            </div>

            {/* Soap Properties */}
            <div>
                <h3 className="text-xl font-semibold mb-4 text-emerald-800">비누 속성 (권장 범위)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8 pt-4">
                    {Object.entries(PROPERTY_RANGES).map(([key, range]) => (
                         <PropertyBar
                            key={key}
                            name={range.name}
                            value={properties[key as keyof typeof properties]}
                            min={range.min}
                            max={range.max}
                        />
                    ))}
                </div>
            </div>

            {/* Fatty Acid Profile */}
            <div>
                <h3 className="text-xl font-semibold mb-3 text-emerald-800">지방산 프로필</h3>
                 <div className="w-full h-80">
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={renderCustomizedLabel}
                                outerRadius={120}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Legend
                                layout="vertical"
                                align="right"
                                verticalAlign="middle"
                                iconSize={10}
                                wrapperStyle={{ fontSize: '14px', paddingLeft: '20px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};