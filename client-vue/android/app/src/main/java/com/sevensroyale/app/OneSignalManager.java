package com.sevensroyale.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.Application;
import android.os.Handler;
import android.os.Looper;

import androidx.annotation.NonNull;

import com.onesignal.OneSignal;
import com.onesignal.Continue;
import com.onesignal.debug.LogLevel;
import com.onesignal.inAppMessages.IInAppMessageDidDismissEvent;
import com.onesignal.inAppMessages.IInAppMessageDidDisplayEvent;
import com.onesignal.inAppMessages.IInAppMessageLifecycleListener;
import com.onesignal.inAppMessages.IInAppMessageWillDismissEvent;
import com.onesignal.inAppMessages.IInAppMessageWillDisplayEvent;
import com.onesignal.user.subscriptions.IPushSubscriptionObserver;
import com.onesignal.user.subscriptions.PushSubscriptionChangedState;

import java.lang.ref.WeakReference;
import java.util.concurrent.atomic.AtomicBoolean;

public final class OneSignalManager {
    private static final OneSignalManager INSTANCE = new OneSignalManager();
    private static final String IAM_TRIGGER_KEY = "ai_implementation_campaign_email_journey";

    public interface NotificationPermissionCallback {
        void onResult(boolean granted);
    }

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final AtomicBoolean initialized = new AtomicBoolean(false);
    private final AtomicBoolean pushSubscriptionObserverRegistered = new AtomicBoolean(false);
    private final AtomicBoolean iamDismissListenerRegistered = new AtomicBoolean(false);
    private final AtomicBoolean welcomeDialogVisible = new AtomicBoolean(false);
    private final AtomicBoolean pushPermissionDialogVisible = new AtomicBoolean(false);
    private final AtomicBoolean pendingWelcomeDialog = new AtomicBoolean(false);
    private final AtomicBoolean pendingPushPermissionDialog = new AtomicBoolean(false);
    private WeakReference<Activity> currentActivityRef = new WeakReference<>(null);

    private OneSignalManager() {}

    public static OneSignalManager getInstance() {
        return INSTANCE;
    }

    public void initialize(Application application, String appId) {
        if (!initialized.compareAndSet(false, true)) return;

        application.registerActivityLifecycleCallbacks(new Application.ActivityLifecycleCallbacks() {
            @Override
            public void onActivityCreated(@NonNull Activity activity, android.os.Bundle savedInstanceState) {
                currentActivityRef = new WeakReference<>(activity);
            }

            @Override
            public void onActivityStarted(@NonNull Activity activity) {
                currentActivityRef = new WeakReference<>(activity);
            }

            @Override
            public void onActivityResumed(@NonNull Activity activity) {
                currentActivityRef = new WeakReference<>(activity);
                flushPendingUi();
            }

            @Override
            public void onActivityPaused(@NonNull Activity activity) {}

            @Override
            public void onActivityStopped(@NonNull Activity activity) {}

            @Override
            public void onActivitySaveInstanceState(@NonNull Activity activity, @NonNull android.os.Bundle outState) {}

            @Override
            public void onActivityDestroyed(@NonNull Activity activity) {
                Activity current = currentActivityRef.get();
                if (current == activity) {
                    currentActivityRef = new WeakReference<>(null);
                }
            }
        });

        OneSignal.getDebug().setLogLevel(LogLevel.VERBOSE);
        OneSignal.initWithContext(application, appId);
        registerPushSubscriptionObserver();
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

    private void registerPushSubscriptionObserver() {
        if (!pushSubscriptionObserverRegistered.compareAndSet(false, true)) return;

        OneSignal.getUser().getPushSubscription().addObserver(new IPushSubscriptionObserver() {
            @Override
            public void onPushSubscriptionChange(PushSubscriptionChangedState state) {
                String previousId = subscriptionIdOf(invokeGetter(state, "getPrevious"));
                String currentId = subscriptionIdOf(invokeGetter(state, "getCurrent"));

                if (isBlank(previousId) && !isBlank(currentId)) {
                    pendingWelcomeDialog.set(true);
                    mainHandler.post(OneSignalManager.this::flushPendingUi);
                }
            }
        });
    }

    private void registerIamDismissListenerIfNeeded() {
        if (!iamDismissListenerRegistered.compareAndSet(false, true)) return;

        OneSignal.getInAppMessages().addLifecycleListener(new IInAppMessageLifecycleListener() {
            @Override
            public void onWillDisplay(IInAppMessageWillDisplayEvent event) {}

            @Override
            public void onDidDisplay(IInAppMessageDidDisplayEvent event) {}

            @Override
            public void onWillDismiss(IInAppMessageWillDismissEvent event) {}

            @Override
            public void onDidDismiss(IInAppMessageDidDismissEvent event) {
                OneSignal.getInAppMessages().removeLifecycleListener(this);
                iamDismissListenerRegistered.set(false);
                pendingPushPermissionDialog.set(true);
                mainHandler.post(OneSignalManager.this::flushPendingUi);
            }
        });
    }

    private void flushPendingUi() {
        Activity activity = getCurrentActivity();
        if (activity == null) return;

        if (pendingWelcomeDialog.compareAndSet(true, false)) {
            showWelcomeDialog(activity);
            return;
        }

        if (pendingPushPermissionDialog.compareAndSet(true, false)) {
            showPushPermissionDialog(activity);
        }
    }

    private void showWelcomeDialog(Activity activity) {
        if (!isActivityUsable(activity) || welcomeDialogVisible.getAndSet(true)) return;

        new AlertDialog.Builder(activity)
            .setTitle("Your OneSignal integration is complete!")
            .setMessage("Click the button below to trigger your first journey via an in-app message.")
            .setPositiveButton("Trigger your first journey", (dialog, which) -> {
                registerIamDismissListenerIfNeeded();
                OneSignal.getInAppMessages().addTrigger(IAM_TRIGGER_KEY, "true");
                dialog.dismiss();
            })
            .setCancelable(false)
            .setOnDismissListener(dialog -> welcomeDialogVisible.set(false))
            .show();
    }

    private void showPushPermissionDialog(Activity activity) {
        if (!isActivityUsable(activity) || pushPermissionDialogVisible.getAndSet(true)) return;

        new AlertDialog.Builder(activity)
            .setTitle("Allow notifications?")
            .setMessage("Sevens Royale uses push notifications for account updates, reminders, and live game alerts.")
            .setPositiveButton("Allow", (dialog, which) -> {
                OneSignal.getNotifications().requestPermission(false, Continue.with(null));
                dialog.dismiss();
            })
            .setNegativeButton("Not now", (dialog, which) -> dialog.dismiss())
            .setCancelable(true)
            .setOnDismissListener(dialog -> pushPermissionDialogVisible.set(false))
            .show();
    }

    private Activity getCurrentActivity() {
        Activity activity = currentActivityRef.get();
        return isActivityUsable(activity) ? activity : null;
    }

    private boolean isActivityUsable(Activity activity) {
        return activity != null && !activity.isFinishing() && !activity.isDestroyed();
    }

    private String subscriptionIdOf(Object subscription) {
        if (subscription == null) return null;
        try {
            Object id = subscription.getClass().getMethod("getId").invoke(subscription);
            return id == null ? null : String.valueOf(id);
        } catch (Exception error) {
            return null;
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private Object invokeGetter(Object target, String methodName) {
        if (target == null) return null;
        try {
            return target.getClass().getMethod(methodName).invoke(target);
        } catch (Exception error) {
            return null;
        }
    }
}
