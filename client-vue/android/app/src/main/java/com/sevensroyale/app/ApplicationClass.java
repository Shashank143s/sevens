package com.sevensroyale.app;

import android.app.Application;

public class ApplicationClass extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        OneSignalManager.getInstance().initialize(this, getString(R.string.onesignal_app_id));
    }
}
