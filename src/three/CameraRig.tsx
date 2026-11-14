"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { lerp } from "@/lib/utils";

/**
 * Subtle parallax: eases the camera toward the pointer position so the
 * whole scene gently reacts to mouse movement. Look target stays centred.
 */
export function CameraRig() {
  const { camera, pointer } = useThree();

  useFrame(() => {
    camera.position.x = lerp(camera.position.x, pointer.x * 2.4, 0.03);
    camera.position.y = lerp(camera.position.y, pointer.y * 1.6 + 1, 0.03);
    camera.lookAt(0, 0, -10);
  });

  return null;
}
