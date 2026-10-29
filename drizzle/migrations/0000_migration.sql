CREATE TYPE public.app_role AS ENUM ('admin','responder','citizen');
CREATE TYPE public.severity AS ENUM ('critical','high','moderate','safe');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL,
  severity public.severity NOT NULL,
  area text NOT NULL,
  instructions text,
  lat double precision,
  lng double precision,
  radius_km double precision DEFAULT 10,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.alerts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.alerts TO authenticated;
GRANT ALL ON public.alerts TO service_role;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read alerts" ON public.alerts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin manage alerts" ON public.alerts FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.shelters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'shelter',
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  capacity int NOT NULL DEFAULT 0,
  occupancy int NOT NULL DEFAULT 0,
  contact text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shelters TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.shelters TO authenticated;
GRANT ALL ON public.shelters TO service_role;
ALTER TABLE public.shelters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read shelters" ON public.shelters FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin manage shelters" ON public.shelters FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  description text NOT NULL,
  severity public.severity NOT NULL DEFAULT 'moderate',
  status text NOT NULL DEFAULT 'reported',
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  photo_url text,
  reporter_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.incidents TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.incidents TO authenticated;
GRANT ALL ON public.incidents TO service_role;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read verified incidents" ON public.incidents FOR SELECT TO anon, authenticated USING (status <> 'reported');
CREATE POLICY "admin manage incidents" ON public.incidents FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.sos_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  phone text CHECK (phone IS NULL OR char_length(phone) <= 20),
  message text CHECK (message IS NULL OR char_length(message) <= 500),
  lat double precision,
  lng double precision,
  status text NOT NULL DEFAULT 'open',
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.sos_requests TO anon, authenticated;
GRANT SELECT, UPDATE ON public.sos_requests TO authenticated;
GRANT ALL ON public.sos_requests TO service_role;
ALTER TABLE public.sos_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can send sos" ON public.sos_requests FOR INSERT TO anon, authenticated WITH CHECK (status = 'open');
CREATE POLICY "staff read sos" ON public.sos_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'responder'));
CREATE POLICY "staff update sos" ON public.sos_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'responder'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;

INSERT INTO public.alerts (title,type,severity,area,instructions,lat,lng,radius_km,created_at) VALUES
('Cyclone warning: landfall expected in 18 hours','cyclone','critical','Visakhapatnam coast','Move to designated shelters. Secure loose objects. Avoid the coastline.',17.6868,83.2185,60, now() - interval '20 minutes'),
('Heavy rainfall & urban flooding','flood','high','Hyderabad – Musi river basin','Avoid low-lying roads and underpasses. Do not cross flowing water.',17.3850,78.4867,25, now() - interval '1 hour'),
('Heatwave advisory: 44°C expected','heatwave','moderate','Vijayawada','Stay indoors 12–4 PM. Drink water frequently. Check on elderly neighbours.',16.5062,80.6480,40, now() - interval '3 hours'),
('Landslide risk on ghat roads','landslide','high','Araku Valley','Avoid ghat road travel after dark until further notice.',18.3273,82.8775,20, now() - interval '5 hours'),
('Flood waters receding','flood','safe','Warangal','Roads reopened. Boil drinking water for 48 hours.',17.9689,79.5941,15, now() - interval '9 hours');

INSERT INTO public.shelters (name,kind,lat,lng,capacity,occupancy,contact) VALUES
('Govt. High School Relief Shelter','shelter',17.3950,78.4750,400,212,'040-2345-6789'),
('Community Hall, Begumpet','shelter',17.4440,78.4670,250,90,'040-2211-4455'),
('Osmania General Hospital','hospital',17.3713,78.4747,800,640,'040-2460-0146'),
('Gandhi Hospital','hospital',17.4243,78.5033,1000,710,'040-2750-5566'),
('Red Cross Relief Camp, Uppal','relief_camp',17.4010,78.5590,300,180,'040-2720-1100'),
('Cyclone Shelter, RK Beach','shelter',17.7140,83.3230,600,420,'0891-256-7788'),
('KGH Hospital Visakhapatnam','hospital',17.7110,83.3010,1200,900,'0891-256-4891');

INSERT INTO public.incidents (type,description,severity,status,lat,lng,created_at) VALUES
('flood','Waterlogging up to 3 ft near Malakpet railway bridge','high','verified',17.3740,78.5010, now() - interval '40 minutes'),
('fire','Fire in commercial complex, Secunderabad','critical','in_progress',17.4399,78.4983, now() - interval '25 minutes'),
('tree_fall','Large tree blocking road at Banjara Hills Rd 12','moderate','verified',17.4120,78.4370, now() - interval '2 hours'),
('flood','Basement flooding cleared, Ameerpet','safe','resolved',17.4375,78.4482, now() - interval '6 hours');