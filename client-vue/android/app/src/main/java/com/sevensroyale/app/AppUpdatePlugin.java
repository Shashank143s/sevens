package com.sevensroyale.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.content.pm.PackageInfo;

import androidx.core.content.pm.PackageInfoCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.play.core.appupdate.AppUpdateInfo;
import com.google.android.play.core.appupdate.AppUpdateManager;
import com.google.android.play.core.appupdate.AppUpdateManagerFactory;
import com.google.android.play.core.appupdate.AppUpdateOptions;
import com.google.android.play.core.install.InstallState;
import com.google.android.play.core.install.InstallStateUpdatedListener;
import com.google.android.play.core.install.model.AppUpdateType;
import com.google.android.play.core.install.model.InstallStatus;
import com.google.android.play.core.install.model.UpdateAvailability;

@CapacitorPlugin(name = "AppUpdate")
public class AppUpdatePlugin extends Plugin {
    private static final int APP_UPDATE_REQUEST_CODE = 8912;

    private AppUpdateManager appUpdateManager;
    private InstallStateUpdatedListener installStateListener;

    @Override
    public void load() {
        super.load();
        appUpdateManager = AppUpdateManagerFactory.create(getContext());
        installStateListener = this::handleInstallStateChange;
        appUpdateManager.registerListener(installStateListener);
    }

    @Override
    protected void handleOnDestroy() {
        if (appUpdateManager != null && installStateListener != null) {
            appUpdateManager.unregisterListener(installStateListener);
        }
        super.handleOnDestroy();
    }

    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);
        if (requestCode != APP_UPDATE_REQUEST_CODE) return;

        JSObject payload = new JSObject();
        if (resultCode == Activity.RESULT_OK) {
            payload.put("status", "accepted");
        } else if (resultCode == Activity.RESULT_CANCELED) {
            payload.put("status", "canceled");
        } else {
            payload.put("status", "failed");
            payload.put("resultCode", resultCode);
        }

        notifyListeners("appUpdateFlowResult", payload, true);
    }

    @PluginMethod
    public void getCurrentAppVersion(PluginCall call) {
        try {
            PackageInfo packageInfo = getPackageInfo();
            long versionCode = PackageInfoCompat.getLongVersionCode(packageInfo);

            JSObject payload = new JSObject();
            payload.put("versionCode", versionCode);
            payload.put("versionName", packageInfo.versionName != null ? packageInfo.versionName : "");
            call.resolve(payload);
        } catch (Exception exception) {
            call.reject("Unable to read current app version", exception);
        }
    }

    @PluginMethod
    public void checkForUpdate(PluginCall call) {
        if (appUpdateManager == null) {
            call.reject("AppUpdateManager is unavailable");
            return;
        }

        appUpdateManager
            .getAppUpdateInfo()
            .addOnSuccessListener((AppUpdateInfo appUpdateInfo) -> call.resolve(buildUpdateInfoPayload(appUpdateInfo)))
            .addOnFailureListener((Exception exception) -> call.reject("Failed to check for updates", exception));
    }

    @PluginMethod
    public void startImmediateUpdate(PluginCall call) {
        startUpdateFlow(call, AppUpdateType.IMMEDIATE);
    }

    @PluginMethod
    public void startFlexibleUpdate(PluginCall call) {
        startUpdateFlow(call, AppUpdateType.FLEXIBLE);
    }

    @PluginMethod
    public void completeFlexibleUpdate(PluginCall call) {
        if (appUpdateManager == null) {
            call.reject("AppUpdateManager is unavailable");
            return;
        }

        appUpdateManager
            .completeUpdate()
            .addOnSuccessListener((Void ignored) -> {
                JSObject payload = new JSObject();
                payload.put("completed", true);
                call.resolve(payload);
            })
            .addOnFailureListener((Exception exception) ->
                call.reject("Failed to complete update installation", exception)
            );
    }

    @PluginMethod
    public void openPlayStoreListing(PluginCall call) {
        if (getActivity() == null) {
            call.reject("No active activity available to open the Play Store");
            return;
        }

        String packageName = getActivity().getPackageName();
        try {
            Intent marketIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + packageName));
            marketIntent.setPackage("com.android.vending");
            marketIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getActivity().startActivity(marketIntent);
        } catch (ActivityNotFoundException ignored) {
            Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=" + packageName));
            browserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getActivity().startActivity(browserIntent);
        }

        call.resolve();
    }

    private void startUpdateFlow(PluginCall call, int updateType) {
        if (appUpdateManager == null) {
            call.reject("AppUpdateManager is unavailable");
            return;
        }
        if (getActivity() == null) {
            call.reject("No active activity available for update flow");
            return;
        }

        appUpdateManager
            .getAppUpdateInfo()
            .addOnSuccessListener((AppUpdateInfo appUpdateInfo) -> {
                boolean updateAvailable = appUpdateInfo.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE;
                boolean typeAllowed = appUpdateInfo.isUpdateTypeAllowed(updateType);

                JSObject payload = new JSObject();
                payload.put("updateAvailable", updateAvailable);
                payload.put("allowed", typeAllowed);

                if (!updateAvailable || !typeAllowed) {
                    payload.put("started", false);
                    call.resolve(payload);
                    return;
                }

                try {
                    boolean started = appUpdateManager.startUpdateFlowForResult(
                        appUpdateInfo,
                        getActivity(),
                        AppUpdateOptions.newBuilder(updateType).build(),
                        APP_UPDATE_REQUEST_CODE
                    );
                    payload.put("started", started);
                    call.resolve(payload);
                } catch (Exception exception) {
                    call.reject("Failed to launch update flow", exception);
                }
            })
            .addOnFailureListener((Exception exception) -> call.reject("Failed to prepare update flow", exception));
    }

    private void handleInstallStateChange(InstallState installState) {
        JSObject payload = new JSObject();
        payload.put("status", installStatusToLabel(installState.installStatus()));
        payload.put("bytesDownloaded", installState.bytesDownloaded());
        payload.put("totalBytesToDownload", installState.totalBytesToDownload());
        payload.put("installErrorCode", installState.installErrorCode());

        notifyListeners("appUpdateStateChanged", payload, true);
    }

    private JSObject buildUpdateInfoPayload(AppUpdateInfo appUpdateInfo) {
        JSObject payload = new JSObject();
        payload.put("supported", true);
        payload.put("updateAvailable", appUpdateInfo.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE);
        payload.put("availableVersionCode", appUpdateInfo.availableVersionCode());
        payload.put("updatePriority", appUpdateInfo.updatePriority());
        payload.put("immediateAllowed", appUpdateInfo.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE));
        payload.put("flexibleAllowed", appUpdateInfo.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE));
        payload.put("installStatus", installStatusToLabel(appUpdateInfo.installStatus()));
        return payload;
    }

    private String installStatusToLabel(int installStatus) {
        switch (installStatus) {
            case InstallStatus.PENDING:
                return "pending";
            case InstallStatus.DOWNLOADING:
                return "downloading";
            case InstallStatus.DOWNLOADED:
                return "downloaded";
            case InstallStatus.INSTALLING:
                return "installing";
            case InstallStatus.INSTALLED:
                return "installed";
            case InstallStatus.FAILED:
                return "failed";
            case InstallStatus.CANCELED:
                return "canceled";
            case InstallStatus.REQUIRES_UI_INTENT:
                return "requires_ui_intent";
            case InstallStatus.UNKNOWN:
            default:
                return "unknown";
        }
    }

    private PackageInfo getPackageInfo() throws Exception {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return getContext().getPackageManager().getPackageInfo(
                getContext().getPackageName(),
                android.content.pm.PackageManager.PackageInfoFlags.of(0)
            );
        }
        return getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), 0);
    }
}
