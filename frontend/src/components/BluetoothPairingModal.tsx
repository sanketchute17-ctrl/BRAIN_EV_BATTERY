import React, { useState } from 'react';
import { Bluetooth, Radio, Wifi, CheckCircle2, AlertCircle, X, Cpu, Loader2, ArrowRight } from 'lucide-react';
import { bluetoothService } from '../services/bluetoothService';
import { batteryStateService } from '../services/batteryStateService';

interface BluetoothPairingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BluetoothPairingModal: React.FC<BluetoothPairingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  if (!isOpen) return null;

  const handleScanWebBluetooth = async () => {
    setIsScanning(true);
    setErrorMsg('');
    setStatusMsg('Scanning nearby Web Bluetooth GATT BMS Peripherals...');

    try {
      await bluetoothService.requestAndConnectDevice();
      setStatusMsg('Bluetooth BMS Successfully Paired & Connected!');
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: any) {
      setErrorMsg(err.message || 'Bluetooth scanning failed or cancelled.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleConnectSimulatedVirtualBattery = () => {
    setIsScanning(true);
    setErrorMsg('');
    setStatusMsg('Pairing Rohit More 96S Virtual Battery BLE GATT Peripheral...');

    setTimeout(() => {
      bluetoothService.startSimulatedBleConnection();
      setStatusMsg('Rohit More Virtual Battery Connected via BLE!');
      setIsScanning(false);
      setTimeout(() => {
        onClose();
      }, 600);
    }, 700);
  };

  const handleDisconnect = () => {
    bluetoothService.disconnect();
    setStatusMsg('Bluetooth BMS Disconnected.');
  };

  const bleState = bluetoothService.getState();

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white rounded-3xl p-5 border border-slate-200 shadow-2xl space-y-4 text-slate-900 overflow-hidden relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-2xs">
              <Bluetooth className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wide">
                BLUETOOTH BMS PAIRING MANAGER
              </h3>
              <p className="text-[10px] font-semibold text-slate-400">
                Pair Physical BLE BMS Hardware or Virtual Battery
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Connection Banner */}
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-bold ${
            bleState.connected
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-slate-100 border-slate-200 text-slate-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                bleState.connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <div>
              <div className="text-[9px] font-extrabold uppercase text-slate-400">STATUS</div>
              <div className="text-xs font-black">
                {bleState.connected ? bleState.deviceName || 'BLE BMS Connected' : 'DISCONNECTED'}
              </div>
            </div>
          </div>

          {bleState.connected && (
            <button
              onClick={handleDisconnect}
              className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 font-extrabold text-[10px] rounded-lg transition uppercase cursor-pointer"
            >
              Disconnect
            </button>
          )}
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {statusMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Pairing Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <button
            onClick={handleScanWebBluetooth}
            disabled={isScanning}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs rounded-2xl transition flex items-center justify-between shadow-md cursor-pointer active:scale-98 disabled:opacity-50"
          >
            <div className="flex items-center gap-2.5">
              <Bluetooth className="w-4.5 h-4.5" />
              <div className="text-left">
                <div className="text-xs font-black leading-tight">SCAN PHYSICAL BLE BMS</div>
                <div className="text-[9px] opacity-80">Ather, Ola, Smart BMS, JBD, Daly</div>
              </div>
            </div>
            {isScanning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={handleConnectSimulatedVirtualBattery}
            disabled={isScanning}
            className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/40 font-extrabold text-xs rounded-2xl transition flex items-center justify-between shadow-sm cursor-pointer active:scale-98 disabled:opacity-50"
          >
            <div className="flex items-center gap-2.5">
              <Cpu className="w-4.5 h-4.5 text-emerald-400" />
              <div className="text-left">
                <div className="text-xs font-black leading-tight">PAIR ROHIT MORE VIRTUAL BATTERY</div>
                <div className="text-[9px] text-slate-400">96S LFP Hardware BLE GATT Peripheral</div>
              </div>
            </div>
            <Wifi className="w-4 h-4 text-emerald-400" />
          </button>
        </div>

        <div className="text-[10px] text-center font-semibold text-slate-400 pt-1">
          🔒 Telemetry will start streaming &amp; syncing to Firebase DB immediately upon pairing.
        </div>
      </div>
    </div>
  );
};

export default BluetoothPairingModal;
