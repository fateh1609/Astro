
import React from 'react';
import { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  onBuy: (product: Product) => void;
  isCompact?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onBuy, isCompact = false }) => {
  return (
    <div className={`bg-mystic-800/60 backdrop-blur-md border border-mystic-600/50 rounded-xl overflow-hidden group hover:border-gold-500/50 transition-all duration-300 flex flex-col ${isCompact ? 'max-w-xs mx-auto md:mx-0' : 'h-full'}`}>
      <div className={`relative overflow-hidden ${isCompact ? 'h-32' : 'h-48'}`}>
        <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider backdrop-blur-sm">
            {product.category}
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-1">
        <h3 className={`font-serif font-bold text-white group-hover:text-gold-400 transition-colors ${isCompact ? 'text-sm' : 'text-lg'}`}>
            {product.name}
        </h3>
        
        {!isCompact && (
            <p className="text-mystic-300 text-sm mt-2 line-clamp-2 flex-1">
                {product.benefits}
            </p>
        )}

        <div className="mt-4 flex items-center justify-between">
            <span className="text-gold-400 font-bold font-mono">
                ₹{product.price.toLocaleString()}
            </span>
            <button 
                onClick={() => onBuy(product)}
                className={`bg-mystic-100 hover:bg-gold-500 hover:text-mystic-900 text-mystic-950 font-bold rounded-lg transition-colors shadow-lg ${isCompact ? 'text-xs px-3 py-1.5' : 'text-sm px-4 py-2'}`}
            >
                Buy Now
            </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
