import React, { useState, useEffect } from 'react';
import { EvaluationConfig, ConfigJSON } from '../types';

interface ConfigBuilderProps {
    navigate: (route: any) => void;
    currentConfig: EvaluationConfig;
    onSave: (config: EvaluationConfig) => void;
}

export const ConfigBuilder: React.FC<ConfigBuilderProps> = ({ navigate, currentConfig, onSave }) => {
    // Mode toggle
    const [mode, setMode] = useState<'ui' | 'json'>('ui');
    
    // Internal state
    const [configName, setConfigName] = useState(currentConfig.name);
    const [jsonString, setJsonString] = useState(JSON.stringify(currentConfig.json, null, 2));
    const [parsedConfig, setParsedConfig] = useState<ConfigJSON>(currentConfig.json);
    const [error, setError] = useState<string | null>(null);

    // Sync JSON string when UI changes
    useEffect(() => {
        setJsonString(JSON.stringify(parsedConfig, null, 2));
    }, [parsedConfig]);

    const handleSave = () => {
        try {
            const finalJson = mode === 'json' ? JSON.parse(jsonString) : parsedConfig;
            onSave({
                ...currentConfig,
                name: configName,
                json: finalJson,
                version: currentConfig.version + 1
            });
            setError(null);
            alert("Configuration updated successfully.");
            navigate({ name: 'dashboard' });
        } catch (e: any) {
            setError("Invalid JSON format: " + e.message);
        }
    };

    // UI Handlers
    const addColor = () => {
        setParsedConfig(prev => ({
            ...prev,
            allowed_colors: [...prev.allowed_colors, { name: 'New Color', hex: '#000000', tolerance: 0.1 }]
        }));
    };

    const updateColor = (index: number, field: string, value: any) => {
        const newColors = [...parsedConfig.allowed_colors];
        newColors[index] = { ...newColors[index], [field]: value };
        setParsedConfig(prev => ({ ...prev, allowed_colors: newColors }));
    };

    const removeColor = (index: number) => {
        const newColors = parsedConfig.allowed_colors.filter((_, i) => i !== index);
        setParsedConfig(prev => ({ ...prev, allowed_colors: newColors }));
    };

    const updateScoring = (val: number) => {
        setParsedConfig(prev => ({ ...prev, scoring: { ...prev.scoring, pass_threshold: val } }));
    };

    const updateGuidelines = (val: string) => {
        setParsedConfig(prev => ({ ...prev, guidelines: val }));
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="md:flex md:items-center md:justify-between mb-6">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">Configuration Builder</h2>
                    <p className="mt-1 text-sm text-slate-500">Customize the BrandGuard AI ruleset.</p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                     <div className="bg-slate-100 p-1 rounded-lg flex">
                        <button 
                            onClick={() => setMode('ui')}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${mode === 'ui' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Visual Editor
                        </button>
                        <button 
                            onClick={() => setMode('json')}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${mode === 'json' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            JSON Source
                        </button>
                     </div>
                    <button 
                        onClick={handleSave}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Save Changes
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded-md bg-red-50 p-4 mb-6">
                    <div className="flex">
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Validation Error</h3>
                            <p className="mt-2 text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                <div className="px-6 py-6 border-b border-slate-200 bg-slate-50">
                     <label className="block text-sm font-medium text-slate-700 mb-1">Config Name</label>
                     <input 
                        type="text" 
                        value={configName} 
                        onChange={(e) => setConfigName(e.target.value)}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-slate-300 rounded-md p-2 border"
                     />
                </div>

                {mode === 'ui' ? (
                    <div className="p-6 space-y-8">
                        {/* Branding Colors */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium leading-6 text-slate-900">Brand Colors</h3>
                                <button onClick={addColor} className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">+ Add Color</button>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {parsedConfig.allowed_colors.map((color, idx) => (
                                    <div key={idx} className="relative rounded-lg border border-slate-300 bg-white px-4 py-3 shadow-sm flex items-center space-x-3 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-slate-400">
                                        <div className="flex-shrink-0">
                                            <input 
                                                type="color" 
                                                value={color.hex} 
                                                onChange={(e) => updateColor(idx, 'hex', e.target.value)}
                                                className="h-10 w-10 rounded border border-slate-200 cursor-pointer"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <input 
                                                type="text" 
                                                value={color.name}
                                                onChange={(e) => updateColor(idx, 'name', e.target.value)}
                                                className="block w-full border-0 p-0 text-slate-900 placeholder-slate-500 focus:ring-0 sm:text-sm font-medium"
                                            />
                                            <input 
                                                type="text" 
                                                value={color.hex}
                                                onChange={(e) => updateColor(idx, 'hex', e.target.value)}
                                                className="block w-full border-0 p-0 text-slate-500 placeholder-slate-500 focus:ring-0 sm:text-xs uppercase"
                                            />
                                        </div>
                                        <button onClick={() => removeColor(idx)} className="text-slate-400 hover:text-red-500">
                                            &times;
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Rules & Scoring */}
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                             <div>
                                <h3 className="text-lg font-medium leading-6 text-slate-900 mb-4">Logo Rules</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">Min Size (px)</label>
                                        <input 
                                            type="number" 
                                            value={parsedConfig.logo_rules.min_size_px}
                                            onChange={(e) => setParsedConfig(prev => ({...prev, logo_rules: {...prev.logo_rules, min_size_px: parseInt(e.target.value)}}))}
                                            className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">Safe Margin (%)</label>
                                        <input 
                                            type="number" 
                                            value={parsedConfig.logo_rules.safe_margin_percent}
                                            onChange={(e) => setParsedConfig(prev => ({...prev, logo_rules: {...prev.logo_rules, safe_margin_percent: parseInt(e.target.value)}}))}
                                            className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                </div>
                             </div>

                             <div>
                                <h3 className="text-lg font-medium leading-6 text-slate-900 mb-4">Scoring</h3>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Pass Threshold ({parsedConfig.scoring.pass_threshold}%)</label>
                                    <input 
                                        type="range" 
                                        min="0" max="100" 
                                        value={parsedConfig.scoring.pass_threshold}
                                        onChange={(e) => updateScoring(parseInt(e.target.value))}
                                        className="w-full mt-2"
                                    />
                                    <div className="flex justify-between text-xs text-slate-500">
                                        <span>Lenient</span>
                                        <span>Strict</span>
                                    </div>
                                </div>
                             </div>
                        </div>

                        {/* Guidelines Text */}
                        <div>
                             <h3 className="text-lg font-medium leading-6 text-slate-900 mb-2">Brand Guidelines (Markdown Supported)</h3>
                             <p className="text-sm text-slate-500 mb-3">Paste your brand tone of voice, do's and don'ts here for the AI to follow.</p>
                             <textarea 
                                rows={8}
                                value={parsedConfig.guidelines || ''}
                                onChange={(e) => updateGuidelines(e.target.value)}
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-slate-300 rounded-md p-3"
                                placeholder="e.g. Tone should be professional but friendly. Never use Comic Sans..."
                             />
                        </div>
                    </div>
                ) : (
                    <div className="p-0">
                        <textarea
                            rows={25}
                            className="shadow-inner focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-slate-300 font-mono p-4 bg-slate-900 text-slate-100"
                            value={jsonString}
                            onChange={(e) => setJsonString(e.target.value)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};