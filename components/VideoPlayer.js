// components/VideoPlayer.js

import { useRef, useEffect, useState, useCallback } from "react";
import CommentarySidebar from "./CommentarySidebar";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY; // Make sure to load this from your .env

// Helper function to generate a random number between min and max
const getRandomBetween = (min, max) => Math.random() * (max - min) + min;

// Helper function to generate a random point between two coordinates
const getRandomWaypointBetween = (coord1, coord2) => {
  const lat = getRandomBetween(coord1.lat, coord2.lat);
  const lng = getRandomBetween(coord1.lng, coord2.lng);
  return { lat, lng };
};

// Generate a random waypoint along the route between the two waypoints
const generateRandomWaypoint = (waypoints) => {
  if (waypoints.length < 2) return null;

  // Select two random consecutive waypoints (or use specific ones)
  const index = Math.floor(Math.random() * (waypoints.length - 1));
  const start = waypoints[index].location;
  const end = waypoints[index + 1].location;

  // Generate a random waypoint between the selected waypoints
  const randomWaypoint = getRandomWaypointBetween(start, end);

  return {
    location: randomWaypoint,
    stopover: true,
  };
};

export default function VideoPlayer({ videoSrc }) {
  const videoRef = useRef(null);
  const mapRef = useRef(null); // Reference to the map container
  const [map, setMap] = useState(null); // Store the map instance
  const [error, setError] = useState(null);
  const [commentary, setCommentary] = useState([]);
  const [showAIMessages, setShowAIMessages] = useState(true);
  const [isAIWatching, setIsAIWatching] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({});
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const commentaryIntervalRef = useRef(null);
  const [waypoints, setWaypoints] = useState([
    {
      location: { lat: 37.7940, lng: -122.4079 }, // Example waypoint 1
      // stopover: true, // Set to true if it's a stop on the route
    },
    {
      location: { lat: 37.7749, lng: -122.4194 }, // Example waypoint 2
      // stopover: true,
    },
  ]); // State to store the dynamic waypoints


  // Function to load the Google Maps API script dynamically
  const loadGoogleMapsScript = useCallback(() => {
    if (!window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.onload = initializeMap;
      document.body.appendChild(script);
    } else {
      initializeMap();
    }
  }, []);
  
  const fetchLatestAnalytics = useCallback(async () => {
    try {
      const response = await fetch("/api/analytics");
      const data = await response.json();
      setAnalyticsData(data);
      console.log("Fetched analytics data:", data); // Log the entire analytics data
    } catch (error) {
      console.error("Error fetching latest analytics:", error);
    }
  }, []);

  useEffect(() => {
    fetchLatestAnalytics();
    const intervalId = setInterval(() => {
      fetchLatestAnalytics();
    }, 2000); // Fetch analytics every 2 seconds

    return () => clearInterval(intervalId);
  }, [fetchLatestAnalytics]);

  // Function to start commentary fetching interval
  const startCommentaryInterval = useCallback(() => {
    if (!commentaryIntervalRef.current) {
      commentaryIntervalRef.current = setInterval(() => {
        fetchCommentary();
      }, 2000);
    }
  }, []);

  // Function to stop commentary fetching interval
  const stopCommentaryInterval = useCallback(() => {
    if (commentaryIntervalRef.current) {
      clearInterval(commentaryIntervalRef.current);
      commentaryIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handlePlay = () => {
        setIsVideoPlaying(true);
        startCommentaryInterval();
      };

      const handlePause = () => {
        setIsVideoPlaying(false);
        stopCommentaryInterval();
      };

      video.addEventListener("play", handlePlay);
      video.addEventListener("playing", handlePlay);
      video.addEventListener("pause", handlePause);
      video.addEventListener("ended", handlePause);

      // Cleanup event listeners on component unmount
      return () => {
        video.removeEventListener("play", handlePlay);
        video.removeEventListener("playing", handlePlay);
        video.removeEventListener("pause", handlePause);
        video.removeEventListener("ended", handlePause);
        stopCommentaryInterval();
      };
    }
  }, [startCommentaryInterval, stopCommentaryInterval]);

  const fetchCommentary = useCallback(async () => {
    try {
      setIsAIWatching(true);
      const canvas = document.createElement("canvas");
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas
        .getContext("2d")
        .drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL("image/jpeg");

      const response = await fetch("/api/commentary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageData,
          width: canvas.width,
          height: canvas.height,
        }),
      });

      const data = await response.json();

      if (data.text) {
        setCommentary((prev) => [
          ...prev,
          {
            timestamp: data.timestamp || new Date().toISOString(),
            text: data.text,
            type: "ai",
            homelessnessProbability: data.likelinessOfHomelessness,
          },
        ]);

        if (data.likelinessOfHomelessness !== undefined &&
        comment.homelessnessProbability >= 75) {
          // add random waypoint
          // Generate a random waypoint along the route
          const randomWaypoint = generateRandomWaypoint(waypoints);
          setWaypoints((waypoints)=> [...waypoints, randomWaypoint]);
          initializeMap();
        }
      } else {
        console.error("No commentary text received from API.");
        setError("No commentary received. Please try again.");
      }

      setIsAIWatching(false);
    } catch (error) {
      console.error("Error generating commentary:", error);
      // setError(
      //   "Error generating commentary. Please check the console for details."
      // );
      setIsAIWatching(false);
    }
  }, []);

  // // Function to initialize the map
  // const initializeMap = useCallback(() => {
  //   if (!map && mapRef.current) {
  //     const googleMap = new window.google.maps.Map(mapRef.current, {
  //       center: { lat: 37.7840, lng: -122.4021 }, // Metreon, San Francisco
  //       zoom: 15, // Adjust zoom level as needed
  //     });
  //     setMap(googleMap);
  //   }
  // }, [map]);

  const initializeMap = useCallback(() => {
    if (!map && mapRef.current) {
      // Create the map instance
      const googleMap = new window.google.maps.Map(mapRef.current, {
        center: { lat: 37.7840, lng: -122.4021 }, // Metreon, San Francisco
        zoom: 14,
      });
  
      // Create a DirectionsService instance
      const directionsService = new window.google.maps.DirectionsService();
  
      // Create a DirectionsRenderer instance
      const directionsRenderer = new window.google.maps.DirectionsRenderer({
        map: googleMap,
      });
  
      // Define the waypoints (other stops along the route)
      // const waypoints = [
      //   {
      //     location: { lat: 37.7940, lng: -122.4079 }, // Example waypoint 1
      //     stopover: true, // Set to true if it's a stop on the route
      //   },
      //   {
      //     location: { lat: 37.7749, lng: -122.4194 }, // Example waypoint 2
      //     stopover: true,
      //   },
      // ];
  
      // Define the request for directions, including the waypoints
      const request = {
        origin: { lat: 37.7840, lng: -122.4021 }, // Starting point
        destination: { lat: 37.7640, lng: -122.4021 }, // Ending point
        waypoints: waypoints, // Array of waypoints
        travelMode: window.google.maps.TravelMode.DRIVING, // Travel mode
      };
  
      // Request the directions and render the result on the map
      directionsService.route(request, (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          directionsRenderer.setDirections(result);
        } else {
          console.error("Directions request failed due to " + status);
        }
      });
  
      // Store the map instance
      setMap(googleMap);
    }
  }, [map]);
  
  useEffect(() => {
    loadGoogleMapsScript();
  }, [loadGoogleMapsScript]);

  // Define the onSendMessage function to handle user messages
  const onSendMessage = useCallback((message) => {
    setCommentary((prev) => [
      ...prev,
      {
        timestamp: new Date().toISOString(),
        text: message,
        type: "user",
      },
    ]);
  }, []);

  // Function to handle text-to-speech when the "Speak" button is clicked
  const handleTextToSpeech = useCallback(() => {
    if (commentary.length === 0) {
      alert("No commentary available for speech synthesis.");
      return;
    }

    const lastCommentary = commentary[commentary.length - 1].text;

    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(lastCommentary);
    synth.speak(utterance);
  }, [commentary]);

  // Chart components

  const TotalCommentariesChart = useCallback(({ commentaries }) => {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-9xl font-bold text-[#9687EC]">{commentaries}</div>
      </div>
    );
  }, []);

  const LatestLatenciesChart = useCallback(({ latencies = [] }) => {
    const data = latencies.map((l) => ({
      timestamp: new Date(l.timestamp).toLocaleString(),
      latency: l.latency ?? 0,
    }));

    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis
            dataKey="timestamp"
            stroke="#2B2B2B"
            tick={{ fontFamily: "Poppins", fill: "#2b2b2b" }}
          />
          <YAxis
            stroke="#2B2B2B"
            tick={{ fontFamily: "Poppins", fill: "#2b2b2b" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#000000",
              borderColor: "#2B2B2B",
            }}
            labelStyle={{ color: "#9687EC", fontFamily: "Poppins" }}
            itemStyle={{ color: "#9687EC", fontFamily: "Poppins" }}
          />
          <Legend wrapperStyle={{ fontFamily: "Poppins", color: "#00FF00" }} />
          <Line
            type="monotone"
            dataKey="latency"
            stroke="#9687EC"
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }, []);

  const HomelessnessOverTimeChart = useCallback(({ homelessnessData = [] }) => {
    console.log("Homelessness Data:", homelessnessData);
    const data = homelessnessData.map((h) => ({
      timestamp: new Date(h.timestamp).toLocaleString(),
      homelessnessProbability: h.homelessness_probability ?? 0,
    }));

    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis
            dataKey="timestamp"
            stroke="#2b2b2b"
            tick={{ fontFamily: "Poppins", fill: "#2b2b2b" }}
          />
          <YAxis
            stroke="2b2b2b"
            tick={{ fontFamily: "Poppins", fill: "#2b2b2b" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#000000",
              borderColor: "black",
            }}
            labelStyle={{ color: "#9687EC", fontFamily: "Poppins" }}
            itemStyle={{ color: "#9687EC", fontFamily: "Poppins" }}
          />
          <Legend wrapperStyle={{ fontFamily: "Poppins", color: "#00FF00" }} />
          <Line
            type="monotone"
            dataKey="homelessnessProbability"
            stroke="#9687EC"
            name="Homelessness Probability"
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white text-black font-poppins">
      <div className="flex flex-grow">
        <div className="w-2/3 p-4 flex flex-col mt-4">
          <div className="video-container">
            <video
              ref={videoRef}
              src={videoSrc}
              controls
              crossOrigin="anonymous"
              className="w-full h-auto object-contain border-none"
            />
            {error && <p className="text-red-500 mt-2">{error}</p>}
            {isAIWatching && <div className="ai-watching">AI is watching</div>}
          </div>
        </div>
        <div className="w-1/3 p-4 flex flex-col" style={{ maxHeight: "80vh" }}>
          <CommentarySidebar
            commentary={commentary}
            showAIMessages={showAIMessages}
            onToggleAIMessages={() => setShowAIMessages(!showAIMessages)}
            onGenerateCommentary={handleTextToSpeech}
            isAIWatching={isAIWatching}
            onSendMessage={onSendMessage}
          />
        </div>
      </div>
  
      {/* Analytics section moved before the map */}
      <div className="bg-white p-4">
        {showAnalytics && (
          <div className="analytics-container">
            <div className="analytics-card">
              <h3 className="text-xl font-semibold mb-2">Total Commentaries</h3>
              <TotalCommentariesChart
                commentaries={analyticsData?.totalCommentaries || 0}
              />
              {console.log(
                "Total Commentaries:",
                analyticsData?.totalCommentaries
              )}
            </div>
  
            <div className="analytics-card">
              <h3 className="text-xl font-semibold mb-2">Latest Latencies</h3>
              <LatestLatenciesChart
                latencies={analyticsData?.latestLatency || []}
              />
              {console.log("Latest Latencies:", analyticsData?.latestLatency)}
            </div>
  
            <div className="analytics-card">
              <h3 className="text-xl font-semibold mb-2 align-center">
                Homelessness Over Time
              </h3>
              <HomelessnessOverTimeChart
                homelessnessData={
                  analyticsData?.homelessnessProbabilityOverTime || []
                }
              />
              {console.log(
                "Homelessness Over Time:",
                analyticsData?.homelessnessProbabilityOverTime
              )}
            </div>
          </div>
        )}
      </div>
  
      {/* Map section moved after the analytics */}
      <div
        ref={mapRef}
        style={{ width: "100%", height: "400px", marginTop: "20px" }}
        className="google-map"
      ></div>
    </div>
  );  
}
