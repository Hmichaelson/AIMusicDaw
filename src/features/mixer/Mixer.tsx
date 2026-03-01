import { ChevronDown, ChevronUp, Volume2 } from 'lucide-react'
import { useTracksStore, useMixerStore, useUIStore } from '@/store'
import { audioEngine } from '@/services/audio'
import { TRACK_COLORS } from '@/config/constants'
import { formatDb, gainToDb } from '@/utils'

export function Mixer() {
  const { tracks, setTrackVolume, toggleTrackMute, toggleTrackSolo } = useTracksStore()
  const { masterVolume, masterMuted, setMasterVolume, toggleMasterMute } = useMixerStore()
  const { mixerCollapsed, toggleMixerCollapsed, mixerHeight } = useUIStore()

  const handleTrackVolumeChange = (trackId: string, volume: number) => {
    setTrackVolume(trackId, volume)
    audioEngine.setTrackVolume(trackId, volume)
  }

  const handleMasterVolumeChange = (volume: number) => {
    setMasterVolume(volume)
    audioEngine.setMasterVolume(volume)
  }

  return (
    <div className="bg-daw-surface border-t border-daw-border">
      {/* Collapse Header */}
      <button
        className="w-full px-4 py-2 flex items-center gap-2 hover:bg-daw-surface-light transition-colors"
        onClick={toggleMixerCollapsed}
      >
        <Volume2 size={16} />
        <span className="text-sm font-medium">Mixer</span>
        <div className="flex-1" />
        {mixerCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {/* Mixer Content */}
      {!mixerCollapsed && (
        <div
          className="flex overflow-x-auto px-4 pb-4 gap-2"
          style={{ height: mixerHeight }}
        >
          {/* Track Channels */}
          {tracks.map((track) => {
            const trackColor = TRACK_COLORS[track.color] || TRACK_COLORS.blue

            return (
              <div
                key={track.id}
                className="flex flex-col items-center bg-daw-surface-light rounded p-2 min-w-[80px]"
              >
                {/* Track Color */}
                <div
                  className="w-full h-1 rounded-full mb-2"
                  style={{ backgroundColor: trackColor }}
                />

                {/* Track Name */}
                <div className="text-xs font-medium truncate w-full text-center mb-2">
                  {track.name}
                </div>

                {/* Pan Knob (simplified as slider) */}
                <div className="w-full mb-2">
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.01"
                    value={track.pan}
                    onChange={(e) => {
                      const pan = parseFloat(e.target.value)
                      useTracksStore.getState().setTrackPan(track.id, pan)
                      audioEngine.setTrackPan(track.id, pan)
                    }}
                    className="w-full h-1 accent-daw-accent"
                    title={`Pan: ${track.pan > 0 ? 'R' : track.pan < 0 ? 'L' : 'C'} ${Math.abs(Math.round(track.pan * 100))}`}
                  />
                </div>

                {/* Volume Fader */}
                <div className="flex-1 flex flex-col items-center w-full">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={track.volume}
                    onChange={(e) => handleTrackVolumeChange(track.id, parseFloat(e.target.value))}
                    className="h-full w-2 accent-daw-accent"
                    style={{
                      writingMode: 'vertical-lr',
                      direction: 'rtl',
                    }}
                  />
                  <div className="text-xs text-daw-text-muted mt-1">
                    {formatDb(gainToDb(track.volume))}
                  </div>
                </div>

                {/* Mute/Solo */}
                <div className="flex gap-1 mt-2">
                  <button
                    className={`px-2 py-0.5 text-xs rounded ${
                      track.muted
                        ? 'bg-red-500 text-white'
                        : 'bg-daw-surface text-daw-text-muted hover:text-daw-text'
                    }`}
                    onClick={() => {
                      toggleTrackMute(track.id)
                      audioEngine.setTrackMute(track.id, !track.muted)
                    }}
                  >
                    M
                  </button>
                  <button
                    className={`px-2 py-0.5 text-xs rounded ${
                      track.solo
                        ? 'bg-yellow-500 text-black'
                        : 'bg-daw-surface text-daw-text-muted hover:text-daw-text'
                    }`}
                    onClick={() => toggleTrackSolo(track.id)}
                  >
                    S
                  </button>
                </div>
              </div>
            )
          })}

          {/* Spacer */}
          <div className="flex-1 min-w-4" />

          {/* Master Channel */}
          <div className="flex flex-col items-center bg-daw-surface-light rounded p-2 min-w-[80px] border-l-2 border-daw-accent">
            <div className="w-full h-1 rounded-full mb-2 bg-daw-accent" />

            <div className="text-xs font-medium mb-2">MASTER</div>

            {/* Master Volume */}
            <div className="flex-1 flex flex-col items-center w-full">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={masterVolume}
                onChange={(e) => handleMasterVolumeChange(parseFloat(e.target.value))}
                className="h-full w-2 accent-daw-accent"
                style={{
                  writingMode: 'vertical-lr',
                  direction: 'rtl',
                }}
              />
              <div className="text-xs text-daw-text-muted mt-1">
                {formatDb(gainToDb(masterVolume))}
              </div>
            </div>

            {/* Master Mute */}
            <button
              className={`px-3 py-1 text-xs rounded mt-2 ${
                masterMuted
                  ? 'bg-red-500 text-white'
                  : 'bg-daw-surface text-daw-text-muted hover:text-daw-text'
              }`}
              onClick={() => {
                toggleMasterMute()
                audioEngine.setMasterMute(!masterMuted)
              }}
            >
              {masterMuted ? 'MUTED' : 'MUTE'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
