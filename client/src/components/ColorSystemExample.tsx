import React from 'react';
import { useColors, useVideoColors, useTheme } from '../hooks/useColors';

// Example component showing how to use the color system
const ColorSystemExample: React.FC = () => {
  const { colors, utils } = useColors('light');
  const videoColors = useVideoColors();
  const themeManager = useTheme();

  const cardStyle = utils.getCardStyle();
  const primaryButtonStyle = utils.getButtonStyle('primary');
  const secondaryButtonStyle = utils.getButtonStyle('secondary');
  const inputStyle = utils.getInputStyle();
  const errorInputStyle = utils.getInputStyle(true);
  
  return (
    <div style={{
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: colors.neutral[50],
      minHeight: '100vh'
    }}>
      <h1 style={{ color: colors.text.primary, marginBottom: '30px' }}>
        Color System Example
      </h1>

      {/* Theme Controls */}
      <div style={{...cardStyle, padding: '20px', marginBottom: '20px'}}>
        <h2 style={{ color: colors.text.primary, marginBottom: '15px' }}>
          Theme Controls
        </h2>
        <button 
          onClick={() => themeManager.setTheme('light')}
          style={{...primaryButtonStyle, padding: '10px 20px', marginRight: '10px'}}
        >
          Light Theme
        </button>
        <button 
          onClick={() => themeManager.setTheme('dark')}
          style={{...secondaryButtonStyle, padding: '10px 20px'}}
        >
          Dark Theme
        </button>
      </div>

      {/* Color Palette Display */}
      <div style={{...cardStyle, padding: '20px', marginBottom: '20px'}}>
        <h2 style={{ color: colors.text.primary, marginBottom: '15px' }}>
          Primary Colors
        </h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {Object.entries(colors.primary).map(([shade, color]) => (
            <div key={shade} style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: color,
                  borderRadius: '8px',
                  border: `1px solid ${colors.neutral[300]}`,
                  marginBottom: '5px'
                }}
              />
              <div style={{ fontSize: '12px', color: colors.text.secondary }}>
                {shade}
              </div>
              <div style={{ fontSize: '10px', color: colors.text.tertiary, fontFamily: 'monospace' }}>
                {color}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Button Examples */}
      <div style={{...cardStyle, padding: '20px', marginBottom: '20px'}}>
        <h2 style={{ color: colors.text.primary, marginBottom: '15px' }}>
          Button Variants
        </h2>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button style={{...utils.getButtonStyle('primary'), padding: '12px 24px', borderRadius: '6px'}}>
            Primary Button
          </button>
          <button style={{...utils.getButtonStyle('secondary'), padding: '12px 24px', borderRadius: '6px'}}>
            Secondary Button
          </button>
          <button style={{...utils.getButtonStyle('success'), padding: '12px 24px', borderRadius: '6px'}}>
            Success Button
          </button>
          <button style={{...utils.getButtonStyle('secondary'), padding: '12px 24px', borderRadius: '6px', backgroundColor: colors.semantic.warning.main, color: colors.text.inverse}}>
            Warning Button
          </button>
          <button style={{...utils.getButtonStyle('danger'), padding: '12px 24px', borderRadius: '6px'}}>
            Danger Button
          </button>
        </div>
      </div>

      {/* Form Elements */}
      <div style={{...cardStyle, padding: '20px', marginBottom: '20px'}}>
        <h2 style={{ color: colors.text.primary, marginBottom: '15px' }}>
          Form Elements
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '400px' }}>
          <input
            type="text"
            placeholder="Normal input"
            style={{...inputStyle, padding: '12px', borderRadius: '6px', border: '1px solid'}}
          />
          <input
            type="text"
            placeholder="Input with error"
            style={{...errorInputStyle, padding: '12px', borderRadius: '6px', border: '1px solid'}}
          />
          <textarea
            placeholder="Textarea"
            style={{...inputStyle, padding: '12px', borderRadius: '6px', border: '1px solid', minHeight: '80px'}}
          />
        </div>
      </div>

      {/* Notifications */}
      <div style={{...cardStyle, padding: '20px', marginBottom: '20px'}}>
        <h2 style={{ color: colors.text.primary, marginBottom: '15px' }}>
          Notifications
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{
            ...utils.getNotificationStyle('success'),
            padding: '12px 16px',
            borderRadius: '6px',
            border: '1px solid'
          }}>
            ✅ Success notification
          </div>
          <div style={{
            ...utils.getNotificationStyle('info'),
            padding: '12px 16px',
            borderRadius: '6px',
            border: '1px solid'
          }}>
            ℹ️ Info notification
          </div>
          <div style={{
            ...utils.getNotificationStyle('warning'),
            padding: '12px 16px',
            borderRadius: '6px',
            border: '1px solid'
          }}>
            ⚠️ Warning notification
          </div>
          <div style={{
            ...utils.getNotificationStyle('error'),
            padding: '12px 16px',
            borderRadius: '6px',
            border: '1px solid'
          }}>
            ❌ Error notification
          </div>
        </div>
      </div>

      {/* Video Controls */}
      <div style={{...cardStyle, padding: '20px', marginBottom: '20px'}}>
        <h2 style={{ color: colors.text.primary, marginBottom: '15px' }}>
          Video Controls
        </h2>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button style={videoColors.utils.getControlButtonStyle('accept')}>
            📞
          </button>
          <button style={videoColors.utils.getControlButtonStyle('decline')}>
            📵
          </button>
          <button style={videoColors.utils.getControlButtonStyle('mute')}>
            🔇
          </button>
          <button style={videoColors.utils.getControlButtonStyle('unmute')}>
            🔊
          </button>
        </div>
      </div>

      {/* Status Indicators */}
      <div style={{...cardStyle, padding: '20px', marginBottom: '20px'}}>
        <h2 style={{ color: colors.text.primary, marginBottom: '15px' }}>
          Status Indicators
        </h2>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={videoColors.utils.getStatusIndicatorStyle('online')} />
            <span style={{ color: colors.text.primary }}>Online</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={videoColors.utils.getStatusIndicatorStyle('busy')} />
            <span style={{ color: colors.text.primary }}>Busy</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={videoColors.utils.getStatusIndicatorStyle('away')} />
            <span style={{ color: colors.text.primary }}>Away</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={videoColors.utils.getStatusIndicatorStyle('offline')} />
            <span style={{ color: colors.text.primary }}>Offline</span>
          </div>
        </div>
      </div>

      {/* CSS Variables Usage */}
      <div style={{...cardStyle, padding: '20px', marginBottom: '20px'}}>
        <h2 style={{ color: colors.text.primary, marginBottom: '15px' }}>
          CSS Variables Usage
        </h2>
        <div style={{
          padding: '15px',
          backgroundColor: 'var(--color-primary-50)',
          border: '1px solid var(--color-primary-200)',
          borderRadius: '8px',
          color: 'var(--color-primary-900)'
        }}>
          This box uses CSS custom properties directly
        </div>
        <div style={{ marginTop: '10px', fontSize: '14px', color: colors.text.tertiary }}>
          <code>background-color: var(--color-primary-50)</code><br />
          <code>border-color: var(--color-primary-200)</code><br />
          <code>color: var(--color-primary-900)</code>
        </div>
      </div>

      {/* Usage Instructions */}
      <div style={{...cardStyle, padding: '20px'}}>
        <h2 style={{ color: colors.text.primary, marginBottom: '15px' }}>
          How to Use
        </h2>
        <div style={{ color: colors.text.secondary, lineHeight: '1.6' }}>
          <h3 style={{ color: colors.text.primary, fontSize: '16px', marginBottom: '10px' }}>
            1. Using React Hooks:
          </h3>
          <pre style={{
            backgroundColor: colors.neutral[100],
            padding: '10px',
            borderRadius: '4px',
            fontSize: '12px',
            overflow: 'auto'
          }}>
{`import { useColors } from '../hooks/useColors';

const MyComponent = () => {
  const { colors, utils } = useColors();
  
  return (
    <button style={utils.getButtonStyle('primary')}>
      Click me
    </button>
  );
};`}
          </pre>

          <h3 style={{ color: colors.text.primary, fontSize: '16px', margin: '20px 0 10px' }}>
            2. Using CSS Custom Properties:
          </h3>
          <pre style={{
            backgroundColor: colors.neutral[100],
            padding: '10px',
            borderRadius: '4px',
            fontSize: '12px',
            overflow: 'auto'
          }}>
{`.my-button {
  background-color: var(--color-primary-500);
  color: var(--color-text-inverse);
  border: 1px solid var(--color-primary-600);
}`}
          </pre>

          <h3 style={{ color: colors.text.primary, fontSize: '16px', margin: '20px 0 10px' }}>
            3. Direct TypeScript Constants:
          </h3>
          <pre style={{
            backgroundColor: colors.neutral[100],
            padding: '10px',
            borderRadius: '4px',
            fontSize: '12px',
            overflow: 'auto'
          }}>
{`import { ColorScheme } from '../styles/ColorScheme';

const style = {
  backgroundColor: ColorScheme.primary[500],
  color: ColorScheme.text.inverse,
};`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ColorSystemExample;