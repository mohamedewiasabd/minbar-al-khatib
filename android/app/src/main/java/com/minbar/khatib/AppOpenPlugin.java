package com.minbar.khatib;

import android.content.Intent;
import android.net.Uri;
import android.content.pm.PackageManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * يفتح تطبيقاً خارجياً باسم الحزمة (Package Name):
 * - إن كان مثبّتاً على الجهاز → يُفتح مباشرة عبر Activity الإقلاع.
 * - غير مثبّت → يُفتح Google Play (متجر) على صفحة التطبيق.
 */
@CapacitorPlugin(name = "AppOpen")
public class AppOpenPlugin extends Plugin {

    @PluginMethod
    public void open(PluginCall call) {
        String pkg = call.getString("packageName");
        if (pkg == null || pkg.trim().isEmpty()) {
            call.reject("packageName is required");
            return;
        }
        pkg = pkg.trim();

        JSObject ret = new JSObject();
        PackageManager pm = getContext().getPackageManager();

        // 1) محاولة فتح التطبيق إذا كان مثبّتاً
        try {
            Intent launchIntent = pm.getLaunchIntentForPackage(pkg);
            if (launchIntent != null) {
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(launchIntent);
                ret.put("opened", true);
                ret.put("source", "native");
                call.resolve(ret);
                return;
            }
        } catch (Exception e) {
            // سنلجأ إلى متجر Play
        }

        // 2) التطبيق غير مثبّت → فتح Google Play
        ret.put("opened", false);
        ret.put("source", "play");
        try {
            Intent play = new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + Uri.encode(pkg)));
            play.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(play);
        } catch (Exception e) {
            try {
                Intent web = new Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=" + Uri.encode(pkg)));
                web.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(web);
            } catch (Exception e2) {
                call.reject(e2.getMessage(), e2);
                return;
            }
        }
        call.resolve(ret);
    }
}