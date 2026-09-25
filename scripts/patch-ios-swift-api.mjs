#!/usr/bin/env node
// تشغيل: node scripts/patch-ios-swift-api.mjs
// يحقن .enableExperimentalFeature("NonescapableTypes") في Package.swift
// لمكوّنات Capacitor القديمة (Capacitor 8.5+ يبني سويفت بالعلم التجريبي
// NonescapableTypes — بدون الحقن يفشل تجميع المكوّنات القديمة على iOS).
import { readFileSync, writeFileSync } from "node:fs";

const FLAG = '.enableExperimentalFeature("NonescapableTypes")';
const PACKAGES = ["@capacitor-community/admob", "@capacitor-firebase/authentication"];

let patched = 0;
for (const pkg of PACKAGES) {
  const file = `node_modules/${pkg}/Package.swift`;
  let s;
  try {
    s = readFileSync(file, "utf8");
  } catch {
    console.warn(`  ⚠ ${pkg}: Package.swift غير موجود — تخطٍ`);
    continue;
  }
  if (s.includes(FLAG)) {
    console.log(`  ✓ ${pkg}: مُحقَن مسبقاً`);
    continue;
  }
  // 1) أهداف بدون swiftSettings: path: "...") → path: "...", swiftSettings: [FLAG])
  s = s.replace(
    /(^[ \t]*path: "([^"]+)")(\))/gm,
    `$1, swiftSettings: [${FLAG}])`
  );
  // 2) أهداف فيها swiftSettings بالفعل: حقن العنصر أول المصفوفة بفاصلة
  s = s.replace(/(swiftSettings: \[\n)/g, `swiftSettings: [\n                ${FLAG},\n`);
  writeFileSync(file, s);
  patched += 1;
  console.log(`  ✓ ${pkg}: حُقن ${FLAG}`);
}
console.log(patched > 0 ? `تمت معالجة ${patched} مكوّن` : "لا مكوّنات لتعديلها");