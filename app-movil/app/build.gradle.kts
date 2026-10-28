import org.gradle.api.tasks.testing.logging.TestExceptionFormat

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// En GitHub Actions cada compilación sube el número de versión.
val buildNumber = System.getenv("VERSION_CODE")?.toIntOrNull() ?: 1

android {
    namespace = "com.alldesignkarl.mipanel"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.alldesignkarl.mipanel"
        minSdk = 26
        targetSdk = 35
        versionCode = buildNumber
        versionName = "2.0.$buildNumber"
    }

    // La clave de firma nunca está en el repositorio: GitHub Actions la pasa por variables
    // de entorno (desde un secreto del repo, o una temporal si no hay secreto).
    val keystore = System.getenv("MIPANEL_KEYSTORE")?.takeIf { it.isNotBlank() }
    signingConfigs {
        if (keystore != null) {
            create("personal") {
                storeFile = file(keystore)
                storeType = "pkcs12"
                storePassword = System.getenv("MIPANEL_KEYSTORE_PASSWORD")
                keyAlias = "mipanel"
                keyPassword = System.getenv("MIPANEL_KEYSTORE_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.findByName("personal") ?: signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    testOptions {
        unitTests {
            isIncludeAndroidResources = true
        }
    }
}

// Si un test falla, que el error completo salga en el log de GitHub Actions.
tasks.withType<Test>().configureEach {
    testLogging {
        events("passed", "failed")
        exceptionFormat = TestExceptionFormat.FULL
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.activity:activity-ktx:1.9.3")

    testImplementation("junit:junit:4.13.2")
    testImplementation("org.robolectric:robolectric:4.14.1")
    testImplementation("androidx.test:core-ktx:1.6.1")
    testImplementation("androidx.test.ext:junit:1.2.1")
}
