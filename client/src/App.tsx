import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import ToneEditor from './components/toneEditor'

function App() {

  return (
    <>
      <div className='flex flex-col items-center justify-center h-screen'>
        <ToneEditor />
      </div>
    </>
  )
}

export default App
