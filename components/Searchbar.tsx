"use client";

import React, { FormEvent, useState } from 'react'

const isValidAmazonProductLink = (url: string)=>{
  try {
    const parsedURL = new URL(url);
    const hostname = parsedURL.hostname;

    if(hostname.includes('amazon.com') || hostname.includes('amazon.') || hostname.endsWith('amazon')){
      return true;
    }
  } catch (error) {
      console.log(error);
  }
}

const Searchbar = () => {
  const [searchPrompt, setSearchPrompt] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const isValidLink = isValidAmazonProductLink(searchPrompt);
  }

  return (
    <form className='flex flex-wrap gap-4 mt-12'
      onSubmit={handleSubmit}
    >
      <input
        type='text'
        value={searchPrompt}
        onChange={(e) => setSearchPrompt(e.target.value)}
        placeholder='Enter product link'
        className='searchbar-input'
      />
      <button type='submit' className='searchbar-btn'>
        Search
      </button>

    </form>
  )
}

export default Searchbar