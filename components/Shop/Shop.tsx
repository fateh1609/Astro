
import React, { useState } from 'react';
import { Product } from '../../types';
import { MOCK_PRODUCTS } from '../../constants';
import ProductCard from './ProductCard';

interface ShopProps {
  onBuy: (product: Product) => void;
}

const Shop: React.FC<ShopProps> = ({ onBuy }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Items' },
    { id: 'gemstone', label: 'Gemstones' },
    { id: 'rudraksha', label: 'Rudraksha' },
    { id: 'yantra', label: 'Yantras' },
    { id: 'pooja', label: 'Pooja Kits' }
  ];

  const filteredProducts = activeCategory === 'all' 
    ? MOCK_PRODUCTS 
    : MOCK_PRODUCTS.filter(p => p.category === activeCategory);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 p-4 md:p-0">
        {/* Header Section */}
        <div className="text-center mb-6 mt-2">
            <h2 className="text-2xl md:text-3xl font-serif text-white mb-2">Spiritual Store</h2>
            <p className="text-mystic-300 text-sm">Authentic remedies, consecrated items & pooja essentials.</p>
        </div>

        {/* Categories Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6 pb-2 justify-start md:justify-center">
            {categories.map(cat => (
                <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                        activeCategory === cat.id 
                        ? 'bg-gold-500 text-mystic-900 border-gold-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]' 
                        : 'bg-mystic-800/50 text-mystic-300 border-mystic-700 hover:border-gold-500/50 hover:text-white'
                    }`}
                >
                    {cat.label}
                </button>
            ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-20 overflow-y-auto scrollbar-hide pr-1">
            {filteredProducts.map(product => (
                <ProductCard 
                    key={product.id} 
                    product={product} 
                    onBuy={onBuy} 
                />
            ))}
            {filteredProducts.length === 0 && (
                <div className="col-span-full text-center text-mystic-500 py-10">
                    No items found in this category.
                </div>
            )}
        </div>
    </div>
  );
};

export default Shop;
