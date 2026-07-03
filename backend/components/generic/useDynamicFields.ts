// // utils/useDynamicFields.ts
// import { useEffect, useMemo, useRef, useState } from "react";
// import { FieldDef } from "@/app/types/index";

// export function useDynamicFields<T = any>(initialFields: FieldDef<T>[]) {
//   const [fields, setFields] = useState<FieldDef<T>[]>(initialFields);

//   // ✅ persist between renders
//   const dynamicOptionsUpdaterRef = useRef<
//     ((fields: FieldDef<T>[], valuesMap: Record<string, any>) => void) | null
//   >(null);

//   const setDynamicOptionsUpdater = (
//     fn: ((fields: FieldDef<T>[], valuesMap: Record<string, any>) => void) | null
//   ) => {
//     dynamicOptionsUpdaterRef.current = fn;
//   };

//   // ✅ whenever initialFields changes (eg options loaded), refresh definitions but keep values
//   useEffect(() => {
//     setFields((prev) => {
//       const prevMap = new Map(prev.map((f) => [String(f.key), f]));
//       const merged = initialFields.map((nf) => {
//         const old = prevMap.get(String(nf.key));
//         return old ? { ...nf, value: old.value } : nf;
//       });

//       // run dependsOn + dynamic options once after merge
//       const valuesMap = Object.fromEntries(merged.map((f) => [f.key as any, f.value]));

//       merged.forEach((f) => {
//         if (f.dependsOn) {
//           if (f.dependsOn.condition) {
//             const result = f.dependsOn.condition(valuesMap);
//             f.hidden = result;
//             f.disabled = result;
//           }
//           if (f.dependsOn.calculate) {
//             f.value = f.dependsOn.calculate(valuesMap);
//           }
//         }
//       });

//       if (dynamicOptionsUpdaterRef.current) {
//         dynamicOptionsUpdaterRef.current(merged, valuesMap);
//       }

//       return merged;
//     });
//   }, [initialFields]);

//   const handleFieldChange = (key: keyof T, value: any) => {
//     setFields((prev) => {
//       const newFields = prev.map((f) => (f.key === key ? { ...f, value } : f));
//       const valuesMap = Object.fromEntries(newFields.map((f) => [f.key as any, f.value]));

//       // Apply dependsOn conditions and calculations
//       newFields.forEach((f) => {
//         if (f.dependsOn) {
//           if (f.dependsOn.condition) {
//             const result = f.dependsOn.condition(valuesMap);
//             f.hidden = result;
//             f.disabled = result;
//           }
//           if (f.dependsOn.calculate) {
//             f.value = f.dependsOn.calculate(valuesMap);
//           }
//         }
//       });

//       // Apply page-specific dynamic options
//       if (dynamicOptionsUpdaterRef.current) {
//         dynamicOptionsUpdaterRef.current(newFields, valuesMap);
//       }

//       return newFields;
//     });
//   };

//   return { fields, setFields, handleFieldChange, setDynamicOptionsUpdater };
// }

// utils/useDynamicFields.ts
import { useEffect, useMemo, useRef, useState } from "react";
import { FieldDef } from "@/app/types/index";

// ✅ create a stable signature so useEffect doesn't run forever
// IMPORTANT: Do NOT include "value" or functions in signature.
function makeSignature<T>(defs: FieldDef<T>[]) {
  return defs
    .map((f) => {
      const opt =
        Array.isArray((f as any).options) && (f as any).options.length
          ? (f as any).options
              .map((o: any) => `${String(o.label)}:${String(o.value)}`)
              .join(",")
          : "";
      return `${String(f.key)}|${String((f as any).label ?? "")}|${opt}`;
    })
    .join("##");
}

export function useDynamicFields<T = any>(initialFields: FieldDef<T>[]) {
  const [fields, setFields] = useState<FieldDef<T>[]>(initialFields);

  // ✅ persist between renders
  const dynamicOptionsUpdaterRef = useRef<
    ((fields: FieldDef<T>[], valuesMap: Record<string, any>) => void) | null
  >(null);

  const setDynamicOptionsUpdater = (
    fn: ((fields: FieldDef<T>[], valuesMap: Record<string, any>) => void) | null
  ) => {
    dynamicOptionsUpdaterRef.current = fn;
  };

  // ✅ only react when field "shape" changes, not when array reference changes
  const signature = useMemo(() => makeSignature(initialFields), [initialFields]);
  const prevSignatureRef = useRef<string>("");

  // ✅ whenever initialFields changes (eg options loaded), refresh definitions but keep values
  useEffect(() => {
    // first mount: record signature, don't force re-set (prevents double set loops)
    if (!prevSignatureRef.current) {
      prevSignatureRef.current = signature;
      return;
    }

    // if signature same => do nothing (prevents infinite loop)
    if (prevSignatureRef.current === signature) return;
    prevSignatureRef.current = signature;

    setFields((prev) => {
      const prevMap = new Map(prev.map((f) => [String(f.key), f]));

      // merge new defs, preserve old values
      let merged = initialFields.map((nf) => {
        const old = prevMap.get(String(nf.key));
        return old ? ({ ...nf, value: (old as any).value } as any) : ({ ...nf } as any);
      });

      // build values map
      let valuesMap = Object.fromEntries(merged.map((f) => [f.key as any, (f as any).value]));

      // apply dependsOn immutably (no in-place mutation)
      merged = merged.map((f) => {
        if (!f.dependsOn) return f;

        let next: any = { ...f };

        if (f.dependsOn.condition) {
          const result = f.dependsOn.condition(valuesMap);
          next.hidden = result;
          next.disabled = result;
        }
        if (f.dependsOn.calculate) {
          next.value = f.dependsOn.calculate(valuesMap);
        }

        return next;
      });

      // rebuild valuesMap in case calculate changed some values
      valuesMap = Object.fromEntries(merged.map((f) => [f.key as any, (f as any).value]));

      if (dynamicOptionsUpdaterRef.current) {
        // allow updater to modify options, but keep array/object refs safe
        const copy = merged.map((f) => ({ ...f }));
        dynamicOptionsUpdaterRef.current(copy, valuesMap);
        return copy;
      }

      return merged;
    });
  }, [signature, initialFields]);

  const handleFieldChange = (key: keyof T, value: any) => {
    setFields((prev) => {
      // update value immutably
      let newFields: any[] = prev.map((f) =>
        f.key === key ? { ...f, value } : { ...f }
      );

      let valuesMap = Object.fromEntries(newFields.map((f) => [f.key as any, f.value]));

      // apply dependsOn immutably
      newFields = newFields.map((f) => {
        if (!f.dependsOn) return f;

        let next: any = { ...f };

        if (f.dependsOn.condition) {
          const result = f.dependsOn.condition(valuesMap);
          next.hidden = result;
          next.disabled = result;
        }
        if (f.dependsOn.calculate) {
          next.value = f.dependsOn.calculate(valuesMap);
        }

        return next;
      });

      // rebuild valuesMap in case calculate changed values
      valuesMap = Object.fromEntries(newFields.map((f) => [f.key as any, f.value]));

      // Apply page-specific dynamic options
      if (dynamicOptionsUpdaterRef.current) {
        const copy = newFields.map((f) => ({ ...f }));
        dynamicOptionsUpdaterRef.current(copy, valuesMap);
        return copy;
      }

      return newFields as any;
    });
  };

  return { fields, setFields, handleFieldChange, setDynamicOptionsUpdater };
}

// Optional: if some files import default, this prevents import mismatch crashes
export default useDynamicFields;
