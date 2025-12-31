import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../theme";

type BrandLogoProps = {
  size?: number;
  color?: string;
};

/**
 * BrandLogo component - Centralized logo for easy replacement
 * 
 * Currently uses MaterialCommunityIcons "truck-fast" as placeholder.
 * To replace with actual logo image, update this component to use Image component.
 */
export default function BrandLogo({ size = 80, color }: BrandLogoProps) {
  return (
    <MaterialCommunityIcons
      name="truck-fast"
      size={size}
      color={color || colors.action.primaryBg}
    />
  );
}

