package com.minbar.khatib;

import android.Manifest;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

/**
 * Saves a base64-encoded file directly into the phone's public Downloads folder.
 * Uses MediaStore (Android 10+) or classic external storage (Android 9-).
 */
@CapacitorPlugin(
        name = "SaveFile",
        permissions = {
                @Permission(strings = {Manifest.permission.WRITE_EXTERNAL_STORAGE}, alias = "storage")
        }
)
public class SaveFilePlugin extends Plugin {

    private PluginCall pendingCall;
    private byte[] pendingData;
    private String pendingFileName;
    private String pendingMime;

    @PluginMethod
    public void save(PluginCall call) {
        String base64 = call.getString("base64");
        String fileName = call.getString("fileName", "download.bin");
        String mime = call.getString("mime", "application/octet-stream");

        if (base64 == null) {
            call.reject("base64 is required");
            return;
        }

        final byte[] data;
        try {
            data = Base64.decode(base64, Base64.DEFAULT);
        } catch (Exception e) {
            call.reject("Invalid base64 data", e);
            return;
        }

        // Android 10+ (API 29): scoped storage via MediaStore, no permission required.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            saveViaMediaStore(data, fileName, mime, call);
            return;
        }

        // Android 9- (API 24-28): classic external storage requires WRITE_EXTERNAL_STORAGE.
        if (hasPermission("storage")) {
            saveLegacy(data, fileName, call);
        } else {
            pendingCall = call;
            pendingData = data;
            pendingFileName = fileName;
            pendingMime = mime;
            requestPermissionForAlias("storage", call, "permissionCallback");
        }
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        if (pendingData == null) {
            call.reject("Storage permission denied");
            return;
        }
        if (hasPermission("storage")) {
            saveLegacy(pendingData, pendingFileName, call);
        } else {
            call.reject("Storage permission denied");
        }
        pendingCall = null;
        pendingData = null;
        pendingFileName = null;
    }

    private void saveViaMediaStore(byte[] data, String fileName, String mime, PluginCall call) {
        try {
            ContentValues values = new ContentValues();
            values.put(MediaStore.Downloads.DISPLAY_NAME, fileName);
            values.put(MediaStore.Downloads.MIME_TYPE, mime);
            values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/MinbarAlKhatib");

            Uri uri = getContext().getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
            if (uri == null) {
                call.reject("Could not create the file");
                return;
            }
            OutputStream os = getContext().getContentResolver().openOutputStream(uri);
            if (os != null) {
                os.write(data);
                os.close();
            } else {
                call.reject("Could not open the file for writing");
                return;
            }

            JSObject ret = new JSObject();
            ret.put("path", uri.toString());
            call.resolve(ret);
        } catch (Exception e) {
            call.reject(e.getMessage(), e);
        }
    }

    private void saveLegacy(byte[] data, String fileName, PluginCall call) {
        try {
            File dir = new File(
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
                    "MinbarAlKhatib"
            );
            if (!dir.exists() && !dir.mkdirs()) {
                call.reject("Could not create the Downloads folder");
                return;
            }
            File file = new File(dir, fileName);
            FileOutputStream fos = new FileOutputStream(file);
            fos.write(data);
            fos.close();

            JSObject ret = new JSObject();
            ret.put("path", file.getAbsolutePath());
            call.resolve(ret);
        } catch (Exception e) {
            call.reject(e.getMessage(), e);
        }
    }
}