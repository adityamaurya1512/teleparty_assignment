import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';


const UserSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) {
        getUser();
      } else {
        setSearchResults([]);
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, page]); // Add 'page' as a dependency

  const getUser = async () => {
    try {
      setLoading(true); // Set loading to true when fetching data

      let queryString = searchTerm.split(' ').join('+');
      const accessToken=process.env.REACT_APP_TOKEN
     console.log(accessToken,'jsjjdsdsjdsjdj')

      const userData = await axios.get(`https://api.github.com/search/users?q=${queryString}&page=${page}`, {
        headers: {
          Authorization: `token ${accessToken}`
        }
      });

      const users = userData.data.items;
      const usersWithFollowers = await Promise.all(
        users.map(async (user) => {
          const followers = await getAllFollowers(user.followers_url, accessToken);
          return { ...user, followers: followers.length };
        })
      );
      usersWithFollowers.sort((a, b) => b.followers - a.followers);
      setSearchResults(usersWithFollowers);
    } catch (error) {
      if (error.response && error.response.status === 403) {
        const resetTime = new Date(error.response.headers['x-ratelimit-reset'] * 1000);
        const currentTime = new Date();
        const delay = resetTime.getTime() - currentTime.getTime();

        console.log(`Rate limit exceeded. Waiting for ${delay} milliseconds before retrying...`);

        await new Promise(resolve => setTimeout(resolve, delay));

        // Retry the request
        await getUser();
      } else {
        console.error('Error fetching user data:', error);
      }
    } finally {
      setLoading(false); // Set loading to false when data fetching is complete
    }
  };

  const getAllFollowers = async (followersUrl, accessToken) => {
    let allFollowers = [];
    let page = 1;
    let perPage = 100;

    while (true) {
      const response = await axios.get(`${followersUrl}?per_page=${perPage}&page=${page}`, {
        headers: {
          Authorization: `token ${accessToken}`
        }
      });

      const followers = response.data;
      if (followers.length === 0) {
        break;
      }

      allFollowers = allFollowers.concat(followers);
      page++;
    }

    return allFollowers;
  };

  const handleChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handlePreviousPage = () => {
    setPage(page - 1);
  };

  const handleNextPage = () => {
    setPage(page + 1);
  };

  return (
    <div>
        <div className='parent-container'>
        <input
        type="text"
        placeholder="Search for users..."
        value={searchTerm}
        onChange={handleChange}
      />
         <button onClick={handlePreviousPage} disabled={page === 1}>Previous</button>
      <button onClick={handleNextPage}>Next</button>
        </div>
      
      {loading && <div>Loading...</div>}
      {!loading && (
        <table>
          <thead>
            <tr>
              <th>Avatar</th>
              <th>UserId</th>
              <th>Followers</th>
            </tr>
          </thead>
          <tbody>
            {searchResults.map(user => (
              <tr key={user.id}>
                <td><img src={user.avatar_url} alt={user.login} width="50" /></td>
                <td>{user.login}</td>
                <td>{user.followers}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserSearch;
