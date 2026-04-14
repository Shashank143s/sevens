package com.sevensroyale.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NotificationPermission")
public class NotificationPermissionPlugin extends Plugin {
    @PluginMethod
    public void getStatus(PluginCall call) {
        call.resolve(buildStatusPayload(OneSignalManager.getInstance().hasNotificationPermission()));
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (getActivity() == null) {
            call.reject("No active activity available for notification permission");
            return;
        }

        OneSignalManager.getInstance().requestNotificationPermission(getActivity(), granted ->
            call.resolve(buildStatusPayload(granted))
        );
    }

    @PluginMethod
    public void openSettings(PluginCall call) {
        if (getActivity() == null) {
            call.reject("No active activity available for settings");
            return;
        }

        Intent intent;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                .putExtra(Settings.EXTRA_APP_PACKAGE, getActivity().getPackageName());
        } else {
            intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
                .setData(Uri.fromParts("package", getActivity().getPackageName(), null));
        }

        getActivity().startActivity(intent);
        call.resolve();
    }

    private JSObject buildStatusPayload(boolean granted) {
        JSObject payload = new JSObject();
        payload.put("granted", granted);
        payload.put("supported", true);
        payload.put("canRequest", !granted);
        return payload;
    }
}
