package com.alldesignkarl.mipanel.estado

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.io.IOException

class StatusViewModel(app: Application) : AndroidViewModel(app) {
    private val whileVisible = SharingStarted.WhileSubscribed(5_000)

    val battery: StateFlow<BatteryInfo?> =
        BatteryMonitor(app).flow().stateIn(viewModelScope, whileVisible, null)

    val bluetooth: StateFlow<BluetoothState> =
        BluetoothMonitor(app).flow().stateIn(viewModelScope, whileVisible, BluetoothState.Loading)

    val network: StateFlow<NetworkInfo?> =
        NetworkMonitor(app).flow().stateIn(viewModelScope, whileVisible, null)

    val device: StateFlow<DeviceInfo?> = flow {
        while (true) {
            emit(DeviceInfo.read(app))
            delay(10_000)
        }
    }.flowOn(Dispatchers.IO).stateIn(viewModelScope, whileVisible, null)

    private val _speedTest = MutableStateFlow<SpeedTestState>(SpeedTestState.Idle)
    val speedTest: StateFlow<SpeedTestState> = _speedTest.asStateFlow()
    private var speedJob: Job? = null

    fun runSpeedTest() {
        if (speedJob?.isActive == true) return
        speedJob = viewModelScope.launch {
            _speedTest.value = SpeedTestState.Running(SpeedPhase.PING, 0f)
            _speedTest.value = try {
                SpeedTester.run { _speedTest.value = it }
            } catch (e: CancellationException) {
                throw e
            } catch (e: IOException) {
                SpeedTestState.Failed("No se ha podido medir: ¿hay internet? (${e.message ?: e.javaClass.simpleName})")
            } catch (e: Exception) {
                SpeedTestState.Failed("Algo ha fallado al medir (${e.javaClass.simpleName})")
            }
        }
    }

    fun cancelSpeedTest() {
        speedJob?.cancel()
        speedJob = null
        _speedTest.value = SpeedTestState.Idle
    }
}
