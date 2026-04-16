package com.sevensroyale.app;

import android.app.Activity;
import android.app.Application;
import android.os.Handler;
import android.os.Looper;

import com.onesignal.OneSignal;
import com.onesignal.Continue;
import com.onesignal.debug.LogLevel;
import java.util.concurrent.atomic.AtomicBoolean;

public final class OneSignalManager {
    private static final OneSignalManager INSTANCE = new OneSignalManager();

    public interface NotificationPermissionCallback {
        void onResult(boolean granted);
    }

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final AtomicBoolean initialized = new AtomicBoolean(false);

    private OneSignalManager() {}

    public static OneSignalManager getInstance() {
        return INSTANCE;
    }

    public void initialize(Application application, String appId) {
        if (!initialized.compareAndSet(false, true)) return;

        OneSignal.getDebug().setLogLevel(LogLevel.VERBOSE);
        OneSignal.initWithContext(application, appId);
    }

    public void login(String externalId) {
        if (externalId == null || externalId.trim().isEmpty()) return;
        OneSignal.login(externalId.trim());
    }

    public void logout() {
        OneSignal.logout();
    }

    public boolean hasNotificationPermission() {
        return OneSignal.getNotifications().getPermission();
    }

    public void requestNotificationPermission(Activity activity, NotificationPermissionCallback callback) {
        if (!isActivityUsable(activity)) {
            if (callback != null) {
                callback.onResult(false);
            }
            return;
        }

        if (hasNotificationPermission()) {
            if (callback != null) {
                callback.onResult(true);
            }
            return;
        }

        mainHandler.post(() -> OneSignal.getNotifications().requestPermission(false, Continue.with(accepted -> {
            boolean granted = OneSignal.getNotifications().getPermission();

            if (callback != null) {
                callback.onResult(granted);
            }
        })));
    }

    private boolean isActivityUsable(Activity activity) {
        return activity != null && !activity.isFinishing() && !activity.isDestroyed();
    }
}
