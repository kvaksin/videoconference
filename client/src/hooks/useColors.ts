import { useMemo } from 'react';
import { ColorScheme, ComponentColors, ThemeVariants, type ThemeVariant } from '../styles/ColorScheme';

// Hook for using colors in React components
export const useColors = (theme: ThemeVariant = 'light') => {
  return useMemo(() => {
    const baseTheme = ThemeVariants[theme];
    
    return {
      // Base color scheme
      colors: ColorScheme,
      
      // Theme-specific colors
      theme: baseTheme,
      
      // Component colors
      components: ComponentColors,
      
      // Utility functions
      utils: {
        // Get CSS variable
        getCSSVar: (varName: string) => `var(--${varName})`,
        
        // Get color with opacity
        withOpacity: (color: string, opacity: number) => {
          if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
          }
          return color;
        },
        
        // Get contrasting text color
        getContrastText: (backgroundColor: string) => {
          const lightColors = [
            ColorScheme.neutral[0],
            ColorScheme.neutral[50],
            ColorScheme.neutral[100],
            ColorScheme.primary[50],
            ColorScheme.primary[100],
            ColorScheme.secondary[50],
            ColorScheme.secondary[100],
          ];
          
          return lightColors.includes(backgroundColor as any)
            ? ColorScheme.text.primary
            : ColorScheme.text.inverse;
        },
        
        // Generate button styles
        getButtonStyle: (variant: keyof typeof ComponentColors.button = 'primary') => ({
          backgroundColor: ComponentColors.button[variant].bg,
          color: ComponentColors.button[variant].text,
          borderColor: ComponentColors.button[variant].border,
          ':hover': {
            backgroundColor: ComponentColors.button[variant].bgHover,
          },
        }),
        
        // Generate card styles
        getCardStyle: () => ({
          backgroundColor: ComponentColors.card.bg,
          borderColor: ComponentColors.card.border,
          boxShadow: ComponentColors.card.shadow,
          ':hover': {
            backgroundColor: ComponentColors.card.hover,
          },
        }),
        
        // Generate input styles
        getInputStyle: (hasError: boolean = false) => ({
          backgroundColor: ComponentColors.input.bg,
          borderColor: hasError ? ComponentColors.input.borderError : ComponentColors.input.border,
          color: ComponentColors.input.text,
          '::placeholder': {
            color: ComponentColors.input.placeholder,
          },
          ':focus': {
            borderColor: ComponentColors.input.borderFocus,
            outline: 'none',
            boxShadow: `0 0 0 3px ${ColorScheme.primary[100]}`,
          },
        }),
        
        // Generate notification styles
        getNotificationStyle: (type: keyof typeof ComponentColors.notification) => ({
          backgroundColor: ComponentColors.notification[type].bg,
          color: ComponentColors.notification[type].text,
          borderColor: ComponentColors.notification[type].border,
        }),
      },
    };
  }, [theme]);
};

// Hook for video-specific colors
export const useVideoColors = () => {
  return useMemo(() => ({
    // Call control colors
    call: {
      accept: ColorScheme.video.callGreen,
      decline: ColorScheme.video.callRed,
      muted: ColorScheme.video.mutedRed,
      active: ColorScheme.video.activeGreen,
    },
    
    // Video UI colors
    ui: {
      overlayDark: ColorScheme.video.overlayDark,
      overlayLight: ColorScheme.video.overlayLight,
      borderActive: ColorScheme.video.borderActive,
      borderInactive: ColorScheme.video.borderInactive,
    },
    
    // Status colors
    status: {
      online: ColorScheme.video.online,
      offline: ColorScheme.video.offline,
      busy: ColorScheme.video.busy,
      away: ColorScheme.video.away,
    },
    
    // Utility functions for video components
    utils: {
      getVideoContainerStyle: (isActive: boolean) => ({
        borderColor: isActive ? ColorScheme.video.borderActive : ColorScheme.video.borderInactive,
        borderWidth: '2px',
        borderStyle: 'solid',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: ColorScheme.neutral[900],
      }),
      
      getControlButtonStyle: (type: 'accept' | 'decline' | 'mute' | 'unmute') => {
        const colorMap = {
          accept: ColorScheme.video.callGreen,
          decline: ColorScheme.video.callRed,
          mute: ColorScheme.video.mutedRed,
          unmute: ColorScheme.video.activeGreen,
        };
        
        return {
          backgroundColor: colorMap[type],
          color: ColorScheme.text.inverse,
          border: 'none',
          borderRadius: '50%',
          width: '48px',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          ':hover': {
            transform: 'scale(1.05)',
            filter: 'brightness(1.1)',
          },
        };
      },
      
      getStatusIndicatorStyle: (status: keyof typeof ColorScheme.video) => ({
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: ColorScheme.video[status],
        border: `2px solid ${ColorScheme.neutral[0]}`,
        display: 'inline-block',
      }),
    },
  }), []);
};

// Hook for theme management
export const useTheme = () => {
  // In a real app, this would connect to a theme context
  return {
    currentTheme: 'light' as ThemeVariant,
    toggleTheme: () => {
      // Implementation would toggle between light/dark
      console.log('Theme toggle not implemented yet');
    },
    setTheme: (theme: ThemeVariant) => {
      // Implementation would set specific theme
      console.log('Set theme:', theme);
      document.documentElement.setAttribute('data-theme', theme);
    },
  };
};

// Export color constants for direct usage
export { ColorScheme, ComponentColors, ThemeVariants };
export type { ThemeVariant };