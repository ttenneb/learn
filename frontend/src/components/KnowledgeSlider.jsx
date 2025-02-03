import { FiActivity, FiZap } from 'react-icons/fi';
import PropTypes from 'prop-types';

const KnowledgeSlider = ({ value, onChange, maxAllowed = 80 }) => {
  const getKnowledgeLabel = (val) => {
    if (val < 20) return 'Novice';
    if (val < 40) return 'Beginner';
    if (val < 60) return 'Intermediate';
    if (val < 80) return 'Advanced';
    return 'Expert';
  };

  const getIconSize = (val) => {
    const baseSize = 16;
    const scale = 1 + (val / 100) * 0.5; // Scale from 1x to 1.5x
    return baseSize * scale;
  };

  const handleChange = (e) => {
    const newValue = parseInt(e.target.value, 10);
    // Only enforce the maximum bound
    onChange(newValue > maxAllowed ? maxAllowed : newValue);
  };

  // Use two icons to create a more dynamic representation
  const Icon = value > 60 ? FiZap : FiActivity;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Knowledge Level
        </span>
        <div className="flex items-center gap-2">
          <Icon 
            className={`transition-all ${
              value > maxAllowed
                ? 'text-gray-400 dark:text-gray-600'
                : 'text-blue-500 dark:text-blue-400'
            }`}
            style={{ 
              width: getIconSize(value), 
              height: getIconSize(value),
            }}
          />
          <span className="text-sm font-medium text-blue-500 dark:text-blue-400">
            {getKnowledgeLabel(value)}
          </span>
        </div>
      </div>

      <div className="relative">
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={handleChange}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(
              to right,
              #3b82f6 0%,
              #3b82f6 ${maxAllowed}%,
              #d1d5db ${maxAllowed}%,
              #d1d5db 100%
            )`
          }}
        />
        
        <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
          <span>0%</span>
          <span className="text-blue-500">{maxAllowed}%</span>
          <span>100%</span>
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {value > maxAllowed ? (
          "This content might be too basic for your level."
        ) : (
          "Perfect range for learning!"
        )}
      </p>
    </div>
  );
};

KnowledgeSlider.propTypes = {
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  maxAllowed: PropTypes.number,
};

export default KnowledgeSlider;
